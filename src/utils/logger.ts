interface LogData {
	[key: string]: any;
}

class Logger {
	private maskSensitiveData(data: any): any {
		if (!data) return data;

		if (typeof data === 'object') {
			const masked = { ...data };

			const sensitiveFields = ['password', 'token', 'secret', 'credit_card', 'db_password'];

			for (const key in masked) {
				if (sensitiveFields.includes(key.toLowerCase())) {
					masked[key] = '[REDACTED]';
				} else if (typeof masked[key] === 'object') {
					masked[key] = this.maskSensitiveData(masked[key]);
				}
			}

			return masked;
		}

		return data;
	}

	private formatLog(level: string, message: string, data?: LogData): string {
		const timestamp = new Date().toISOString();
		const logData = data ? this.maskSensitiveData(data) : {};

		return JSON.stringify({
			timestamp,
			level,
			message,
			...logData
		});
	}

	info(message: string, data?: LogData): void {
		console.log(this.formatLog('INFO', message, data));
	}

	warn(message: string, data?: LogData): void {
		console.warn(this.formatLog('WARN', message, data));
	}

	error(message: string, error?: any, data?: LogData): void {
		const errorData = error ? {
			errorMessage: error.message,
			errorName: error.name,
			errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
			...data
		} : data;

		console.error(this.formatLog('ERROR', message, errorData));
	}

	debug(message: string, data?: LogData): void {
		if (process.env.DEBUG === 'true') {
			console.debug(this.formatLog('DEBUG', message, data));
		}
	}
}

export const logger = new Logger();
