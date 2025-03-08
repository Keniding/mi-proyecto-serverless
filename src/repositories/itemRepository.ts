import { Repository, DataSource } from 'typeorm';
import { Item } from '../entities/item.entity';
import { DatabaseError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface ItemRepository {
	create(item: Partial<Item>): Promise<number>;
	findAll(): Promise<Item[]>;
	findById(id: number): Promise<Item>;
	update(id: number, item: Partial<Item>): Promise<number>;
	delete(id: number): Promise<number>;
	findAllPaginated(page: number, limit: number): Promise<{ items: Item[]; total: number }>;
}

export class TypeORMItemRepository implements ItemRepository {
	private readonly repository: Repository<Item>;

	/**
	 * Constructor del repositorio TypeORM
	 * @param dataSource Fuente de datos de TypeORM
	 */
	constructor(dataSource: DataSource) {
		this.repository = dataSource.getRepository(Item);
	}

	/**
	 * Crea un nuevo item
	 * @param itemData Datos del item a crear
	 * @returns ID del item creado
	 */
	async create(itemData: Partial<Item>): Promise<number> {
		try {
			const item = this.repository.create({
				nombre: itemData.nombre,
				descripcion: itemData.descripcion
			});

			const savedItem = await this.repository.save(item);

			return savedItem.id;
		} catch (error) {
			logger.error('Error en repositorio al crear item:', error);
			throw new DatabaseError('Error al crear item en la base de datos');
		}
	}

	/**
	 * Obtiene todos los items
	 * @returns Lista de items
	 */
	async findAll(): Promise<Item[]> {
		try {
			return await this.repository.find({
				order: {
					createdAt: 'DESC'
				}
			});
		} catch (error) {
			logger.error('Error en repositorio al obtener items:', error);
			throw new DatabaseError('Error al consultar items en la base de datos');
		}
	}

	/**
	 * Obtiene items con paginación
	 * @param page Número de página (comenzando desde 1)
	 * @param limit Número de elementos por página
	 * @returns Lista de items y total de registros
	 */
	async findAllPaginated(page: number, limit: number): Promise<{ items: Item[]; total: number }> {
		try {
			const [items, total] = await this.repository.findAndCount({
				order: {
					createdAt: 'DESC'
				},
				skip: (page - 1) * limit,
				take: limit
			});

			return {
				items,
				total
			};
		} catch (error) {
			logger.error('Error al obtener items paginados de la base de datos:', error);
			throw new DatabaseError('Error al obtener items paginados de la base de datos');
		}
	}

	/**
	 * Obtiene un item por su ID
	 * @param id ID del item a buscar
	 * @returns El item encontrado
	 * @throws NotFoundError si el item no existe
	 */
	async findById(id: number): Promise<Item> {
		try {
			const item = await this.repository.findOne({
				where: { id }
			});

			if (!item) {
				throw new NotFoundError(`No se encontró ningún item con ID: ${id}`);
			}

			return item;
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error;
			}
			logger.error(`Error en repositorio al obtener item con ID ${id}:`, error);
			throw new DatabaseError('Error al consultar item en la base de datos');
		}
	}

	/**
	 * Actualiza un item existente
	 * @param id ID del item a actualizar
	 * @param itemData Datos a actualizar
	 * @returns Número de filas afectadas
	 * @throws NotFoundError si el item no existe
	 */
	async update(id: number, itemData: Partial<Item>): Promise<number> {
		try {
			await this.findById(id);

			const result = await this.repository.update(id, {
				nombre: itemData.nombre,
				descripcion: itemData.descripcion
			});

			return result.affected || 0;
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error;
			}
			logger.error(`Error en repositorio al actualizar item con ID ${id}:`, error);
			throw new DatabaseError('Error al actualizar item en la base de datos');
		}
	}

	/**
	 * Elimina un item por su ID
	 * @param id ID del item a eliminar
	 * @returns Número de filas afectadas
	 * @throws NotFoundError si el item no existe
	 */
	async delete(id: number): Promise<number> {
		try {
			await this.findById(id);

			const result = await this.repository.delete(id);

			return result.affected || 0;
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error;
			}
			logger.error(`Error en repositorio al eliminar item con ID ${id}:`, error);
			throw new DatabaseError('Error al eliminar item en la base de datos');
		}
	}
}
