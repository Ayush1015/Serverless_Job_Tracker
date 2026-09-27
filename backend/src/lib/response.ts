import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

// Every response goes through here so CORS headers and JSON encoding
// stay consistent across all handlers.
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*', // fine for a learning project; restrict to your frontend domain in production
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function json(statusCode: number, body: unknown): APIGatewayProxyStructuredResultV2 {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

export function badRequest(errors: string[]): APIGatewayProxyStructuredResultV2 {
  return json(400, { message: 'Validation failed', errors });
}

export function notFound(id: string): APIGatewayProxyStructuredResultV2 {
  return json(404, { message: `Application ${id} not found` });
}

export function serverError(err: unknown): APIGatewayProxyStructuredResultV2 {
  console.error('Unhandled error', err);
  return json(500, { message: 'Internal server error' });
}
