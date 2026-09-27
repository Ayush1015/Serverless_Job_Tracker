import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, tableName } from '../lib/dynamodb';
import { json, notFound, serverError } from '../lib/response';
import { userIdFromEvent } from '../lib/auth';

// DELETE /applications/{id}
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const userId = userIdFromEvent(event);
    const id = event.pathParameters?.id ?? '';
    try {
      await docClient.send(
        new DeleteCommand({
          TableName: tableName(),
          Key: { id },
          ConditionExpression: 'attribute_exists(id) AND userId = :userId',
          ExpressionAttributeValues: { ':userId': userId },
        })
      );
      return json(200, { message: 'deleted', id });
    } catch (err) {
      if ((err as { name?: string }).name === 'ConditionalCheckFailedException') return notFound(id);
      throw err;
    }
  } catch (err) {
    return serverError(err);
  }
}
