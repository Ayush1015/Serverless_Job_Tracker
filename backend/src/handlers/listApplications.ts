import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { applicationsIndexName, docClient, tableName } from '../lib/dynamodb';
import { json, serverError } from '../lib/response';
import type { JobApplication } from '../types';
import { userIdFromEvent } from '../lib/auth';

// GET /applications
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const userId = userIdFromEvent(event);
    const result = await docClient.send(new QueryCommand({
      TableName: tableName(),
      IndexName: applicationsIndexName(),
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      ScanIndexForward: false,
    }));
    const items = (result.Items ?? []) as JobApplication[];
    return json(200, { items, count: items.length });
  } catch (err) {
    return serverError(err);
  }
}
