import type { APIGatewayProxyEventV2 } from 'aws-lambda';

// Minimal fake API Gateway event - handlers only read body and pathParameters.
export function event(overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    body: undefined,
    pathParameters: undefined,
    requestContext: {
      authorizer: { jwt: { claims: { sub: 'test-user' }, scopes: [] } },
    } as unknown as APIGatewayProxyEventV2['requestContext'],
    ...overrides,
  } as APIGatewayProxyEventV2;
}

export function parseBody(result: { body?: string }) {
  return JSON.parse(result.body ?? 'null');
}
