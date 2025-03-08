import { APIGatewayProxyHandler } from "aws-lambda";
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import cors from '@middy/http-cors';
import { ItemService } from "../services/itemService";
import { TypeORMItemRepository } from "../repositories/itemRepository";
import { success, notFound, serverError, badRequest, tooManyRequests } from "../libs/apiResponses";
import { NotFoundError, DatabaseError } from "../utils/errors";
import { logger } from "../utils/logger";
import { InMemoryRateLimit } from '../middleware/rateLimiter';
import { paginationMiddleware } from '../middleware/paginationMiddleware';
import { bootstrap } from "../bootstrap";

let repository: TypeORMItemRepository;
let service: ItemService;

const initializeServices = async () => {
	if (!repository) {
		const dataSource = await bootstrap();
		repository = new TypeORMItemRepository(dataSource);
		service = new ItemService(repository);
	}
};

const rateLimiter = new InMemoryRateLimit({
	windowMs: 60 * 1000,
	max: 50
});

/**
 * Handler para obtener todos los items
 */
const getAllBaseHandler: APIGatewayProxyHandler = async (event) => {
	try {
		try {
			await rateLimiter.check(event);
		} catch (error: any) {
			return tooManyRequests(error.message);
		}

		await initializeServices();

		const { page = 1, limit = 10 } = event.queryStringParameters || {};
		const pageNum = Number(page);
		const limitNum = Number(limit);

		try {
			const { items, total } = await service.getAllItemsPaginated(pageNum, limitNum);

			logger.info(`Items obtenidos exitosamente`, {
				count: items.length,
				page: pageNum,
				limit: limitNum,
				total
			});

			const totalPages = Math.ceil(total / limitNum);
			const hasNextPage = pageNum < totalPages;
			const hasPrevPage = pageNum > 1;

			return success({
				items,
				count: items.length,
				pagination: {
					page: pageNum,
					limit: limitNum,
					total,
					totalPages,
					hasNextPage,
					hasPrevPage
				},
				message: "Items obtenidos exitosamente"
			});
		} catch (error) {
			throw error;
		}
	} catch (error) {
		logger.error('Error en handler de obtención de todos los items:', error);

		if (error instanceof DatabaseError) {
			return serverError(error.message);
		}

		return serverError("Error al procesar la solicitud");
	}
};

/**
 * Handler para obtener un item por su ID
 */
const getByIdBaseHandler: APIGatewayProxyHandler = async (event) => {
	try {
		try {
			await rateLimiter.check(event);
		} catch (error: any) {
			return tooManyRequests(error.message);
		}

		await initializeServices();

		const id = event.pathParameters?.id;
		if (!id || isNaN(Number(id))) {
			return badRequest("ID no válido o no proporcionado");
		}

		try {
			const item = await service.getItemById(Number(id));

			logger.info(`Item obtenido exitosamente`, { itemId: id });

			return success({
				item,
				message: "Item obtenido exitosamente"
			});
		} catch (error) {
			if (error instanceof NotFoundError) {
				return notFound(error.message);
			}
			throw error;
		}
	} catch (error) {
		logger.error('Error en handler de obtención de item por ID:', error);

		if (error instanceof DatabaseError) {
			return serverError(error.message);
		}

		return serverError("Error al procesar la solicitud");
	}
};

export const getAll = middy(getAllBaseHandler)
	.use(paginationMiddleware())
	.use(cors())
	.use(httpErrorHandler());

export const getById = middy(getByIdBaseHandler)
	.use(cors())
	.use(httpErrorHandler());
