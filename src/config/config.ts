import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface DatabaseConfig {
	host: string;
	port: number;
	user: string;
	password: string;
	name: string;
}

interface Config {
	nodeEnv: string;
	port: number;
	database: DatabaseConfig;
	jwtSecret: string;
	corsOrigin: string;
}

export const config: Config = {
	nodeEnv: process.env.NODE_ENV ?? 'development',
	port: parseInt(process.env.PORT ?? '3000', 10),
	database: {
		host: process.env.DB_HOST ?? 'localhost',
		port: parseInt(process.env.DB_PORT ?? '3306', 10),
		user: process.env.DB_USER ?? 'root',
		password: process.env.DB_PASSWORD ?? '',
		name: process.env.DB_NAME ?? 'items_db'
	},
	jwtSecret: process.env.JWT_SECRET ?? 'your-secret-key',
	corsOrigin: process.env.CORS_ORIGIN ?? '*'
};
