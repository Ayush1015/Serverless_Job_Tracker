import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, tableName } from '../lib/dynamodb';
import { json, notFound, serverError } from '../lib/response';
import { userIdFromEvent } from '../lib/auth';

// GET /applications/{id}
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const userId = userIdFromEvent(event);
    const id = event.pathParameters?.id ?? '';
    const result = await docClient.send(new GetCommand({ TableName: tableName(), Key: { id } }));
    if (!result.Item || result.Item.userId !== userId) return notFound(id);
    return json(200, result.Item);
  } catch (err) {
    return serverError(err);
  }
}
