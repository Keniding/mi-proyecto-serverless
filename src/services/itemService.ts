import { Item } from '../entities/item.entity';
import { ItemRepository } from '../repositories/itemRepository';
import { logger } from '../utils/logger';

export class ItemService {
	constructor(private readonly repository: ItemRepository) {}

	/**
	 * Crea un nuevo item
	 * @param itemData Datos del item a crear
	 * @returns El item creado con su ID
	 */
	async createItem(itemData: Partial<Item>): Promise<{ id: number; item: Partial<Item> }> {
		const id = await this.repository.create(itemData);

		logger.info(`Item creado con ID ${id}`);

		return {
			id,
			item: itemData
		};
	}

	/**
	 * Obtiene todos los items
	 * @returns Lista de items
	 */
	async getAllItems(): Promise<Item[]> {
		return this.repository.findAll();
	}

	/**
	 * Obtiene todos los items con paginación
	 * @param page Número de página (comenzando desde 1)
	 * @param limit Número de elementos por página
	 * @returns Lista de items y total de registros
	 */
	async getAllItemsPaginated(page: number = 1, limit: number = 10): Promise<{ items: Item[]; total: number }> {
		return this.repository.findAllPaginated(page, limit);
	}

	/**
	 * Obtiene un item por su ID
	 * @param id ID del item
	 * @returns El item encontrado
	 * @throws NotFoundError si el item no existe
	 */
	async getItemById(id: number): Promise<Item> {
		return this.repository.findById(id);
	}

	/**
	 * Actualiza un item existente
	 * @param id ID del item a actualizar
	 * @param itemUpdate Datos a actualizar
	 * @returns Resultado de la operación
	 * @throws NotFoundError si el item no existe
	 */
	async updateItem(id: number, itemUpdate: Partial<Item>): Promise<{ id: number; affectedRows: number }> {
		const affectedRows = await this.repository.update(id, itemUpdate);

		logger.info(`Item con ID ${id} actualizado`);

		return {
			id,
			affectedRows
		};
	}

	/**
	 * Elimina un item
	 * @param id ID del item a eliminar
	 * @returns Resultado de la operación
	 * @throws NotFoundError si el item no existe
	 */
	async deleteItem(id: number): Promise<{ id: number; affectedRows: number }> {
		const affectedRows = await this.repository.delete(id);

		logger.info(`Item con ID ${id} eliminado`);

		return {
			id,
			affectedRows
		};
	}
}
