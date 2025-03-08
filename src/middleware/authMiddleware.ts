import { APIGatewayProxyEvent } from 'aws-lambda';
import { AuthorizationError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface AuthUser {
	id: string;
	roles: string[];
}

export interface AuthorizedEvent extends APIGatewayProxyEvent {
	user: AuthUser;
}

export const authenticate = (event: APIGatewayProxyEvent): AuthorizedEvent => {
	try {
		const authHeader = event.headers.Authorization ?? event.headers.authorization;

		if (!authHeader) {
			throw new AuthorizationError('Token de autorización no proporcionado');
		}

		const tokenParts = authHeader.split(' ');
		if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
			throw new AuthorizationError('Formato de token inválido');
		}

		const token = tokenParts[1];

		const user: AuthUser = {
			id: 'user-123', // Esto vendría del token decodificado
			roles: ['user'] // Roles del usuario desde el token
		};

		return {
			...event,
			user
		};
	} catch (error) {
		logger.error('Error de autenticación:', error);
		if (error instanceof AuthorizationError) {
			throw error;
		}
		throw new AuthorizationError('Error al autenticar usuario');
	}
};

export const authorize = (event: AuthorizedEvent, requiredRoles: string[] = []): void => {
	if (requiredRoles.length === 0) {
		return; // No se requieren roles específicos
	}

	const hasRequiredRole = event.user.roles.some(role => requiredRoles.includes(role));

	if (!hasRequiredRole) {
		throw new AuthorizationError('No tiene permisos suficientes para esta operación');
	}
};
