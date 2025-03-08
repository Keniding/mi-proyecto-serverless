import { APIGatewayProxyHandler } from "aws-lambda";
import pool from "../libs/db";
import { success, notFound, serverError } from "../libs/apiResponses";

export const handler: APIGatewayProxyHandler = async (event) => {
	try {
		const id = event.pathParameters?.id;

		if (!id) {
			return notFound("ID no proporcionado");
		}

		const connection = await pool.getConnection();

		try {
			const [existingItems] = await connection.query(
				"SELECT * FROM items WHERE id = ?",
				[id]
			);

			const items = existingItems as any[];

			if (items.length === 0) {
				return notFound(`No se encontró ningún item con ID: ${id}`);
			}

			const [result] = await connection.query(
				"DELETE FROM items WHERE id = ?",
				[id]
			);

			const affectedRows = (result as any).affectedRows;

			return success({
				id,
				affectedRows,
				message: "Item eliminado exitosamente"
			});
		} finally {
			connection.release();
		}
	} catch (error) {
		console.error("Error al eliminar item:", error);
		return serverError("Error al procesar la solicitud");
	}
};
