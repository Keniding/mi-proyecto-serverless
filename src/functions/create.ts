import { APIGatewayProxyHandler } from "aws-lambda";
import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';
import cors from '@middy/http-cors';
import { ItemService } from "../services/itemService";
import { TypeORMItemRepository } from "../repositories/itemRepository";
import { created, badRequest, serverError, tooManyRequests } from "../libs/apiResponses";
import { ValidationError, DatabaseError } from "../utils/errors";
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

		if (!event.body) {
			return badRequest("El cuerpo de la solicitud no puede estar vacío");
		}

		const itemData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

		if (!itemData || Object.keys(itemData).length === 0) {
			return badRequest("Datos de item inválidos");
		}

		const result = await service.createItem(itemData);

		return created({
			id: result.id,
			...result.item,
			message: "Item creado exitosamente"
		});
	} catch (error) {
		logger.error('Error en handler de creación de item:', error);

		if (error instanceof ValidationError) {
			return badRequest(error.message);
		}

		if (error instanceof DatabaseError) {
			return serverError(error.message);
		}

		return serverError("Error al procesar la solicitud");
	}
};

export const handler = middy(baseHandler)
	.use(httpJsonBodyParser())
	.use(cors())
	.use(httpErrorHandler());
