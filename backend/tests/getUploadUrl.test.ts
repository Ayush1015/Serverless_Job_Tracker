import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { handler } from '../src/handlers/getUploadUrl';
import { event, parseBody } from './helpers';

const s3Mock = mockClient(S3Client);

beforeAll(() => {
  // getSignedUrl signs locally (no network call), but the SDK still needs
  // a region and credentials to compute the signature. Dummy values suffice.
  process.env.AWS_REGION = 'ap-south-1';
  process.env.AWS_ACCESS_KEY_ID = 'test-key';
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
});

beforeEach(() => s3Mock.reset());

describe('POST /upload-url', () => {
  it('returns a presigned URL and a sanitized key', async () => {
    s3Mock.on(PutObjectCommand).resolves({});
    const result = await handler(
      event({ body: JSON.stringify({ filename: '../../my resume.pdf', contentType: 'application/pdf' }) })
    );
    expect(result.statusCode).toBe(200);
    const body = parseBody(result);
    expect(body.uploadUrl).toContain('https://');
    expect(body.key).toMatch(/^uploads\/test-user\/[0-9a-f-]{36}-.*resume\.pdf$/);
    expect(body.key).not.toContain('..');
  });

  it('rejects a disallowed content type', async () => {
    const result = await handler(
      event({ body: JSON.stringify({ filename: 'evil.exe', contentType: 'application/x-msdownload' }) })
    );
    expect(result.statusCode).toBe(400);
  });

  it('rejects a missing filename', async () => {
    const result = await handler(event({ body: JSON.stringify({ contentType: 'application/pdf' }) }));
    expect(result.statusCode).toBe(400);
  });
});
