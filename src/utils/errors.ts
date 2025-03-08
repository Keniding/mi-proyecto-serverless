export class AppError extends Error {
	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationError extends AppError {
	constructor(message: string) {
		super(message);
	}
}

export class NotFoundError extends AppError {
	constructor(message: string) {
		super(message);
	}
}

export class DatabaseError extends AppError {
	constructor(message: string) {
		super(message);
	}
}

export class AuthorizationError extends AppError {
	constructor(message: string) {
		super(message);
	}
}
