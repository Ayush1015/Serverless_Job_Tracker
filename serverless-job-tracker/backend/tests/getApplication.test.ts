import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../src/handlers/getApplication';
import { event, parseBody } from './helpers';

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => ddbMock.reset());

describe('GET /applications/{id}', () => {
  it('returns the item when it exists', async () => {
    ddbMock.on(GetCommand).resolves({ Item: { id: 'abc', userId: 'test-user', company: 'Nike' } });
    const result = await handler(event({ pathParameters: { id: 'abc' } }));
    expect(result.statusCode).toBe(200);
    expect(parseBody(result).company).toBe('Nike');
  });

  it('returns 404 when missing', async () => {
    ddbMock.on(GetCommand).resolves({});
    const result = await handler(event({ pathParameters: { id: 'nope' } }));
    expect(result.statusCode).toBe(404);
  });

  it('returns 404 when the item belongs to another user', async () => {
    ddbMock.on(GetCommand).resolves({ Item: { id: 'abc', userId: 'another-user', company: 'Nike' } });
    const result = await handler(event({ pathParameters: { id: 'abc' } }));
    expect(result.statusCode).toBe(404);
  });
});
