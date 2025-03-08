import { APIGatewayProxyHandler } from "aws-lambda";
import pool from "../libs/db";
import { Item } from "../models/item";
import { success, badRequest, notFound, serverError } from "../libs/apiResponses";

export const handler: APIGatewayProxyHandler = async (event) => {
	try {
		const id = event.pathParameters?.id;

		if (!id) {
			return badRequest("ID no proporcionado");
		}

		if (!event.body) {
			return badRequest("No se proporcionó un cuerpo en la solicitud");
		}

		const itemUpdate: Partial<Item> = JSON.parse(event.body);

		if (!itemUpdate.nombre && !itemUpdate.descripcion) {
			return badRequest("Se debe proporcionar al menos un campo para actualizar");
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

			const updateFields: string[] = [];
			const values: any[] = [];

			if (itemUpdate.nombre) {
				updateFields.push("nombre = ?");
				values.push(itemUpdate.nombre);
			}

			if (itemUpdate.descripcion) {
				updateFields.push("descripcion = ?");
				values.push(itemUpdate.descripcion);
			}

			updateFields.push("updatedAt = NOW()");

			values.push(id);

			const [result] = await connection.query(
				`UPDATE items SET ${updateFields.join(", ")} WHERE id = ?`,
				values
			);

			const affectedRows = (result as any).affectedRows;

			return success({
				id,
				...itemUpdate,
				affectedRows,
				message: "Item actualizado exitosamente"
			});
		} finally {
			connection.release();
		}
	} catch (error) {
		console.error("Error al actualizar item:", error);
		return serverError("Error al procesar la solicitud");
	}
};
