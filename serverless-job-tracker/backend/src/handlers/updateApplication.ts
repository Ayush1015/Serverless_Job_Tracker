import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, tableName } from '../lib/dynamodb';
import { json, badRequest, notFound, serverError } from '../lib/response';
import { validateUpdate } from '../lib/validate';
import { userIdFromEvent } from '../lib/auth';

// PUT /applications/{id}
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const userId = userIdFromEvent(event);
    const id = event.pathParameters?.id ?? '';
    const body = event.body ? JSON.parse(event.body) : null;
    const { errors, value } = validateUpdate(body);
    if (!value) return badRequest(errors);
    if (value.resumeKey !== undefined && !value.resumeKey.startsWith(`uploads/${userId}/`)) {
      return badRequest(['resumeKey must belong to the authenticated user']);
    }

    // Build the UpdateExpression only for fields actually provided,
    // so a partial update never wipes the rest of the item.
    const names: Record<string, string> = { '#updatedAt': 'updatedAt' };
    const values: Record<string, unknown> = { ':updatedAt': new Date().toISOString(), ':userId': userId };
    names['#userId'] = 'userId';
    const sets: string[] = ['#updatedAt = :updatedAt'];
    for (const [key, val] of Object.entries(value)) {
      names[`#${key}`] = key;
      values[`:${key}`] = val;
      sets.push(`#${key} = :${key}`);
    }

    try {
      const result = await docClient.send(
        new UpdateCommand({
          TableName: tableName(),
          Key: { id },
          UpdateExpression: `SET ${sets.join(', ')}`,
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: values,
          // This condition makes the update atomic: if the id does not exist,
          // DynamoDB rejects the write instead of silently creating an item.
          ConditionExpression: 'attribute_exists(id) AND #userId = :userId',
          ReturnValues: 'ALL_NEW',
        })
      );
      return json(200, result.Attributes);
    } catch (err) {
      if ((err as { name?: string }).name === 'ConditionalCheckFailedException') return notFound(id);
      throw err;
    }
  } catch (err) {
    if (err instanceof SyntaxError) return badRequest(['body must be valid JSON']);
    return serverError(err);
  }
}
