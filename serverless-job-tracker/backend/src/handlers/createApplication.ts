import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, tableName } from '../lib/dynamodb';
import { json, badRequest, serverError } from '../lib/response';
import { validateCreate } from '../lib/validate';
import type { JobApplication } from '../types';
import { userIdFromEvent } from '../lib/auth';

// POST /applications
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const userId = userIdFromEvent(event);
    const body = event.body ? JSON.parse(event.body) : null;
    const { errors, value } = validateCreate(body);
    if (!value) return badRequest(errors);

    const now = new Date().toISOString();
    const item: JobApplication = {
      id: crypto.randomUUID(),
        userId,
      ...value,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({ TableName: tableName(), Item: item }));
    return json(201, item);
  } catch (err) {
    if (err instanceof SyntaxError) return badRequest(['body must be valid JSON']);
    return serverError(err);
  }
}
