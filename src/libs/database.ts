import "reflect-metadata";
import { DataSource } from 'typeorm';
import { Item } from '../entities/item.entity';
import { logger } from '../utils/logger';
import { config } from "../config/config";

export const AppDataSource = new DataSource({
	type: 'mysql',
	host: config.database.host,
	port: config.database.port,
	username: config.database.user,
	password: config.database.password,
	database: config.database.name,
	synchronize: false,
	logging: false,
	entities: [Item],
	migrations: [],
	subscribers: []
});

export const initializeDatabase = async (): Promise<DataSource> => {
	try {
		if (!AppDataSource.isInitialized) {
			await AppDataSource.initialize();
			logger.info('Conexión a la base de datos establecida');
		}
		return AppDataSource;
	} catch (error) {
		logger.error('Error al inicializar la conexión a la base de datos:', error);
		throw error;
	}
};
