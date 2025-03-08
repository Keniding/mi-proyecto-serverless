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
	max: 10
});

const baseHandler: APIGatewayProxyHandler = async (event) => {
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
			const result = await service.deleteItem(Number(id));

			logger.info(`Item eliminado exitosamente`, { itemId: id });

			return success({
				id: Number(id),
				affectedRows: result.affectedRows,
				message: "Item eliminado exitosamente"
			});
		} catch (error) {
			if (error instanceof NotFoundError) {
				return notFound(error.message);
			}
			throw error;
		}
	} catch (error) {
		logger.error('Error en handler de eliminación de item:', error);

		if (error instanceof DatabaseError) {
			return serverError(error.message);
		}

		return serverError("Error al procesar la solicitud");
	}
};

export const handler = middy(baseHandler)
	.use(cors())
	.use(httpErrorHandler());
