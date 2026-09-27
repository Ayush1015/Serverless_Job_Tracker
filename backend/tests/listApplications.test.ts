import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../src/handlers/listApplications';
import { event, parseBody } from './helpers';

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => ddbMock.reset());

describe('GET /applications', () => {
  it('returns items sorted newest first', async () => {
    ddbMock.on(QueryCommand).callsFake((input) => {
      expect(input.IndexName).toBe('UserIdCreatedAtIndex');
      expect(input.KeyConditionExpression).toBe('userId = :userId');
      expect(input.ExpressionAttributeValues).toEqual({ ':userId': 'test-user' });
      expect(input.ScanIndexForward).toBe(false);
      return {
        Items: [
          { id: '2', userId: 'test-user', company: 'New', createdAt: '2026-09-20T00:00:00.000Z' },
          { id: '1', userId: 'test-user', company: 'Old', createdAt: '2026-09-01T00:00:00.000Z' },
        ],
      };
    });
    const result = await handler(event());
    expect(result.statusCode).toBe(200);
    const body = parseBody(result);
    expect(body.count).toBe(2);
    expect(body.items[0].company).toBe('New');
  });

  it('returns an empty list when the table is empty', async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [] });
    const result = await handler(event());
    expect(parseBody(result)).toEqual({ items: [], count: 0 });
  });
});
