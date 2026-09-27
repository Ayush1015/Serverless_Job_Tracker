import type { APIGatewayProxyEventV2 } from 'aws-lambda';

export function userIdFromEvent(event: APIGatewayProxyEventV2): string {
  const requestContext = event.requestContext as typeof event.requestContext & {
    authorizer?: { jwt?: { claims?: Record<string, unknown> } };
  };
  const userId = requestContext.authorizer?.jwt?.claims?.sub;
  if (typeof userId !== 'string' || userId.length === 0) {
    throw new Error('Authenticated user id is missing');
  }
  return userId;
}