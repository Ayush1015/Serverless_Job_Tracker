import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { handler } from '../src/handlers/updateApplication';
import { event, parseBody } from './helpers';

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => ddbMock.reset());

describe('PUT /applications/{id}', () => {
  it('updates only provided fields and bumps updatedAt', async () => {
    ddbMock.on(UpdateCommand).callsFake((input) => {
      expect(input.UpdateExpression).toContain('#status = :status');
      expect(input.UpdateExpression).toContain('#updatedAt = :updatedAt');
      expect(input.UpdateExpression).not.toContain('#company');
      expect(input.ConditionExpression).toBe('attribute_exists(id) AND #userId = :userId');
      expect(input.ExpressionAttributeValues?.[':userId']).toBe('test-user');
      return { Attributes: { id: 'abc', status: 'INTERVIEW', company: 'Nike' } };
    });
    const result = await handler(
      event({ pathParameters: { id: 'abc' }, body: JSON.stringify({ status: 'INTERVIEW' }) })
    );
    expect(result.statusCode).toBe(200);
    expect(parseBody(result).status).toBe('INTERVIEW');
  });

  it('persists a resume key', async () => {
    ddbMock.on(UpdateCommand).callsFake((input) => {
      expect(input.UpdateExpression).toContain('#resumeKey = :resumeKey');
      expect(input.ExpressionAttributeValues?.[':resumeKey']).toBe('uploads/test-user/resume.pdf');
      return { Attributes: { id: 'abc', resumeKey: 'uploads/test-user/resume.pdf' } };
    });
    const result = await handler(
      event({ pathParameters: { id: 'abc' }, body: JSON.stringify({ resumeKey: 'uploads/test-user/resume.pdf' }) })
    );
    expect(result.statusCode).toBe(200);
    expect(parseBody(result).resumeKey).toBe('uploads/test-user/resume.pdf');
  });

  it('rejects a resume key outside the current user prefix', async () => {
    const result = await handler(
      event({ pathParameters: { id: 'abc' }, body: JSON.stringify({ resumeKey: 'uploads/another-user/resume.pdf' }) })
    );
    expect(result.statusCode).toBe(400);
    expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(0);
  });

  it('rejects an empty update', async () => {
    const result = await handler(event({ pathParameters: { id: 'abc' }, body: '{}' }));
    expect(result.statusCode).toBe(400);
  });

  it('returns 404 when the item does not exist', async () => {
    ddbMock.on(UpdateCommand).rejects(
      new ConditionalCheckFailedException({ $metadata: {}, message: 'condition failed' })
    );
    const result = await handler(
      event({ pathParameters: { id: 'nope' }, body: JSON.stringify({ status: 'OFFER' }) })
    );
    expect(result.statusCode).toBe(404);
  });
});
