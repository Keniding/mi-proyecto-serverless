import middy from '@middy/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Opciones para el middleware de paginación
 */
interface PaginationOptions {
	defaultPage?: number;
	defaultLimit?: number;
	maxLimit?: number;
}

/**
 * Middleware para validar y normalizar parámetros de paginación
 * @param options Opciones de configuración
 */
export const paginationMiddleware = (options: PaginationOptions = {}) => {
	const {
		defaultPage = 1,
		defaultLimit = 10,
		maxLimit = 100
	} = options;

	const before: middy.MiddlewareFn<APIGatewayProxyEvent, APIGatewayProxyResult> = async (request) => {
		const { event } = request;

		if (!event.queryStringParameters) {
			event.queryStringParameters = {};
		}

		let page = Number(event.queryStringParameters.page ?? defaultPage);
		if (isNaN(page) || page < 1) {
			page = defaultPage;
		}

		let limit = Number(event.queryStringParameters.limit ?? defaultLimit);
		if (isNaN(limit) || limit < 1) {
			limit = defaultLimit;
		}

		if (limit > maxLimit) {
			limit = maxLimit;
		}

		event.queryStringParameters.page = String(page);
		event.queryStringParameters.limit = String(limit);
	};

	return {
		before
	};
};
