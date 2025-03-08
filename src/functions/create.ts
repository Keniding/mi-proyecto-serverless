import { APIGatewayProxyHandler } from "aws-lambda";
import pool from "../libs/db";
import { Item } from "../models/item";
import { created, badRequest, serverError } from "../libs/apiResponses";

export const handler: APIGatewayProxyHandler = async (event) => {
	try {
		if (!event.body) {
			return badRequest("No se proporcionó un cuerpo en la solicitud");
		}

		const item: Item = JSON.parse(event.body);

		if (!item.nombre || !item.descripcion) {
			return badRequest("Nombre y descripción son campos requeridos");
		}

		const connection = await pool.getConnection();

		try {
			const [result] = await connection.query(
				"INSERT INTO items (nombre, descripcion) VALUES (?, ?)",
				[item.nombre, item.descripcion]
			);

			const insertId = (result as any).insertId;

			return created({
				id: insertId,
				...item,
				message: "Item creado exitosamente"
			});
		} finally {
			connection.release();
		}
	} catch (error) {
		console.error("Error al crear item:", error);
		return serverError("Error al procesar la solicitud");
	}
};
