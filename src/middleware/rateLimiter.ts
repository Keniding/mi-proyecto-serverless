import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { logger } from '../utils/logger';

interface RateLimitOptions {
	windowMs: number;
	max: number;
	keyGenerator?: (event: APIGatewayProxyEvent) => string;
}

export class RateLimit {
	protected readonly options: RateLimitOptions;
	private readonly dynamoDb: DynamoDB.DocumentClient;
	private readonly tableName: string;

	constructor(options: RateLimitOptions) {
		this.options = {
			windowMs: options.windowMs || 60 * 1000, // 1 minuto por defecto
			max: options.max || 10, // 10 solicitudes por defecto
			keyGenerator: options.keyGenerator || this.defaultKeyGenerator
		};

		this.dynamoDb = new DynamoDB.DocumentClient();
		this.tableName = process.env.RATE_LIMIT_TABLE ?? 'rate-limits';
	}

	private defaultKeyGenerator(event: APIGatewayProxyEvent): string {
		const ip = event.requestContext.identity?.sourceIp || 'unknown';
		const path = event.path || '/';
		const method = event.httpMethod || 'GET';

		return `${ip}:${method}:${path}`;
	}

	async check(event: APIGatewayProxyEvent): Promise<void> {
		if (process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true') {
			return;
		}

		try {
			const key = this.options.keyGenerator!(event);
			const now = Date.now();
			const windowStart = now - this.options.windowMs;

			// En una implementación real, usaríamos DynamoDB o Redis
			// Esta es una implementación simplificada para demostración

			// Verificar si existe un registro para esta clave
			const params = {
				TableName: this.tableName,
				Key: { id: key }
			};

			try {
				const result = await this.dynamoDb.get(params).promise();
				const record = result.Item as { id: string; count: number; expires: number } | undefined;

				if (!record || record.expires < now) {
					await this.dynamoDb.put({
						TableName: this.tableName,
						Item: {
							id: key,
							count: 1,
							expires: now + this.options.windowMs
						}
					}).promise();
				} else {
					if (record.count >= this.options.max) {
						const resetTime = new Date(record.expires).toISOString();
						logger.warn(`Rate limit excedido para ${key}`, { resetTime });

						throw new Error(`Demasiadas solicitudes. Intente nuevamente después de ${resetTime}`);
					}

					await this.dynamoDb.update({
						TableName: this.tableName,
						Key: { id: key },
						UpdateExpression: 'SET #count = #count + :inc',
						ExpressionAttributeNames: { '#count': 'count' },
						ExpressionAttributeValues: { ':inc': 1 }
					}).promise();
				}
			} catch (error) {
				// Si hay un error con DynamoDB, registrarlo pero permitir la solicitud
				// para evitar bloquear al usuario por problemas de infraestructura
				logger.error('Error al verificar rate limit:', error);

				// En un entorno de producción, podrías implementar una solución de fallback
				// como un contador en memoria con un TTL
			}
		} catch (error) {
			logger.error('Error en rate limiter:', error);
			throw error;
		}
	}
}

// Implementación en memoria para entornos de desarrollo o pruebas
export class InMemoryRateLimit extends RateLimit {
	private readonly store: Map<string, { count: number; expires: number }>;

	constructor(options: RateLimitOptions) {
		super(options);
		this.store = new Map();

		setInterval(() => this.cleanup(), 60000);
	}

	private cleanup(): void {
		const now = Date.now();
		for (const [key, value] of this.store.entries()) {
			if (value.expires < now) {
				this.store.delete(key);
			}
		}
	}

	async check(event: APIGatewayProxyEvent): Promise<void> {
		if (process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true') {
			return;
		}

		const key = this.options.keyGenerator!(event);
		const now = Date.now();

		if (!this.store.has(key)) {
			this.store.set(key, {
				count: 1,
				expires: now + this.options.windowMs
			});
			return;
		}

		const record = this.store.get(key)!;

		if (record.expires < now) {
			this.store.set(key, {
				count: 1,
				expires: now + this.options.windowMs
			});
			return;
		}

		if (record.count >= this.options.max) {
			const resetTime = new Date(record.expires).toISOString();
			logger.warn(`Rate limit excedido para ${key}`, { resetTime });
			throw new Error(`Demasiadas solicitudes. Intente nuevamente después de ${resetTime}`);
		}

		record.count += 1;
	}
}
