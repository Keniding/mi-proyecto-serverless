export const formatResponse = (statusCode: number, body: any) => {
	return {
		statusCode,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Credentials": true,
		},
		body: JSON.stringify(body),
	};
};

export const success =
	(body: any) => formatResponse(200, body);
export const created =
	(body: any) => formatResponse(201, body);
export const badRequest =
	(message: string) => formatResponse(400, { error: message });
export const notFound =
	(message: string) => formatResponse(404, { error: message });
export const serverError =
	(message: string) => formatResponse(500, { error: message });
