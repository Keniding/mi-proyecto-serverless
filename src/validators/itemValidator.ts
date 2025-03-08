import Joi from 'joi';
import { Item } from '../models/item';
import {ValidationError} from "../utils/errors";

export const createItemSchema = Joi.object<Item>({
	nombre: Joi.string().trim().min(1).max(100).required()
		.messages({
			'string.empty': 'El nombre no puede estar vacío',
			'string.min': 'El nombre debe tener al menos {#limit} caracteres',
			'string.max': 'El nombre no puede exceder {#limit} caracteres',
			'any.required': 'El nombre es requerido'
		}),
	descripcion: Joi.string().trim().min(1).max(500).required()
		.messages({
			'string.empty': 'La descripción no puede estar vacía',
			'string.min': 'La descripción debe tener al menos {#limit} caracteres',
			'string.max': 'La descripción no puede exceder {#limit} caracteres',
			'any.required': 'La descripción es requerida'
		})
});

export const updateItemSchema = Joi.object<Partial<Item>>({
	nombre: Joi.string().trim().min(1).max(100)
		.messages({
			'string.empty': 'El nombre no puede estar vacío',
			'string.min': 'El nombre debe tener al menos {#limit} caracteres',
			'string.max': 'El nombre no puede exceder {#limit} caracteres'
		}),
	descripcion: Joi.string().trim().min(1).max(500)
		.messages({
			'string.empty': 'La descripción no puede estar vacía',
			'string.min': 'La descripción debe tener al menos {#limit} caracteres',
			'string.max': 'La descripción no puede exceder {#limit} caracteres'
		})
}).min(1).messages({
	'object.min': 'Se debe proporcionar al menos un campo para actualizar'
});

export const validateItem = <T>(data: any, schema: Joi.ObjectSchema<T>): { value: T; error?: string } => {
	const { error, value } = schema.validate(data, { abortEarly: false });

	if (error) {
		const errorMessage = error.details.map(detail => detail.message).join('; ');
		return { value: value as T, error: errorMessage };
	}

	return { value: value as T };
};

export function validateUpdateItem(data: any): Partial<Item> {
	const { error, value } = updateItemSchema.validate(data, {
		abortEarly: false,
		stripUnknown: true
	});

	if (error) {
		const errorMessages = error.details.map(detail => detail.message).join('; ');
		throw new ValidationError(errorMessages);
	}

	return value;
}

export function validateCreateItem(data: any): Partial<Item> {
	const { error, value } = createItemSchema.validate(data, {
		abortEarly: false,
		stripUnknown: true
	});

	if (error) {
		const errorMessages = error.details.map(detail => detail.message).join('; ');
		throw new ValidationError(errorMessages);
	}

	return value;
}
