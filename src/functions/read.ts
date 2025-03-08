import { APIGatewayProxyHandler } from "aws-lambda";
import pool from "../libs/db";
import { success, notFound, serverError } from "../libs/apiResponses";

export const getAll: APIGatewayProxyHandler = async () => {
	try {
		const connection = await pool.getConnection();

		try {
			const [items] = await connection.query("SELECT * FROM items");

			return success({
				items,
				count: (items as any[]).length,
				message: "Items obtenidos exitosamente"
			});
		} finally {
			connection.release();
		}
	} catch (error) {
		console.error("Error al obtener items:", error);
		return serverError("Error al procesar la solicitud");
	}
};

export const getById: APIGatewayProxyHandler = async (event) => {
	try {
		const id = event.pathParameters?.id;

		if (!id) {
			return notFound("ID no proporcionado");
		}

		const connection = await pool.getConnection();

		try {
			const [items] = await connection.query(
				"SELECT * FROM items WHERE id = ?",
				[id]
			);

			const itemsArray = items as any[];

			if (itemsArray.length === 0) {
				return notFound(`No se encontró ningún item con ID: ${id}`);
			}

			return success({
				item: itemsArray[0],
				message: "Item obtenido exitosamente"
			});
		} finally {
			connection.release();
		}
	} catch (error) {
		console.error("Error al obtener item:", error);
		return serverError("Error al procesar la solicitud");
	}
};
