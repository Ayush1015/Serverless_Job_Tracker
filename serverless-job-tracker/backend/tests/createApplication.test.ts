import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from '../src/handlers/createApplication';
import { event, parseBody } from './helpers';

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => ddbMock.reset());

describe('POST /applications', () => {
  it('creates an application and returns 201', async () => {
    ddbMock.on(PutCommand).resolves({});
    const result = await handler(
      event({ body: JSON.stringify({ company: 'Nike', role: 'Software Engineer I', status: 'APPLIED' }) })
    );
    expect(result.statusCode).toBe(201);
    const body = parseBody(result);
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.company).toBe('Nike');
    expect(body.userId).toBe('test-user');
    expect(body.createdAt).toBeDefined();
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
  });

  it('defaults status to APPLIED when omitted', async () => {
    ddbMock.on(PutCommand).resolves({});
    const result = await handler(event({ body: JSON.stringify({ company: 'Nike', role: 'SWE' }) }));
    expect(parseBody(result).status).toBe('APPLIED');
  });

  it('rejects a missing company with 400 and does not touch DynamoDB', async () => {
    const result = await handler(event({ body: JSON.stringify({ role: 'SWE' }) }));
    expect(result.statusCode).toBe(400);
    expect(parseBody(result).errors.join(' ')).toContain('company');
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(0);
  });

  it('rejects an invalid status', async () => {
    const result = await handler(
      event({ body: JSON.stringify({ company: 'Nike', role: 'SWE', status: 'HIRED' }) })
    );
    expect(result.statusCode).toBe(400);
  });

  it('rejects a non-http jobUrl', async () => {
    const result = await handler(
      event({ body: JSON.stringify({ company: 'Nike', role: 'SWE', jobUrl: 'ftp://x' }) })
    );
    expect(result.statusCode).toBe(400);
  });

  it('rejects malformed JSON', async () => {
    const result = await handler(event({ body: '{not json' }));
    expect(result.statusCode).toBe(400);
  });

  it('returns 500 when DynamoDB fails', async () => {
    ddbMock.on(PutCommand).rejects(new Error('throttled'));
    const result = await handler(event({ body: JSON.stringify({ company: 'Nike', role: 'SWE' }) }));
    expect(result.statusCode).toBe(500);
  });
});
