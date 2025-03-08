import "reflect-metadata";
import { AppDataSource, initializeDatabase } from "./libs/database";
import { logger } from "./utils/logger";

let isInitialized = false;

export const bootstrap = async () => {
	if (!isInitialized) {
		try {
			await initializeDatabase();
			isInitialized = true;
			logger.info("Aplicación inicializada correctamente");
		} catch (error) {
			logger.error("Error al inicializar la aplicación:", error);
			throw error;
		}
	}
	return AppDataSource;
};
