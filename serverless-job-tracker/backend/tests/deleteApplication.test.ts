import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { handler } from '../src/handlers/deleteApplication';
import { event } from './helpers';

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => ddbMock.reset());

describe('DELETE /applications/{id}', () => {
  it('deletes an existing item', async () => {
    ddbMock.on(DeleteCommand).callsFake((input) => {
      expect(input.ConditionExpression).toBe('attribute_exists(id) AND userId = :userId');
      expect(input.ExpressionAttributeValues).toEqual({ ':userId': 'test-user' });
      return {};
    });
    const result = await handler(event({ pathParameters: { id: 'abc' } }));
    expect(result.statusCode).toBe(200);
  });

  it('returns 404 when the item does not exist', async () => {
    ddbMock.on(DeleteCommand).rejects(
      new ConditionalCheckFailedException({ $metadata: {}, message: 'condition failed' })
    );
    const result = await handler(event({ pathParameters: { id: 'nope' } }));
    expect(result.statusCode).toBe(404);
  });
});
