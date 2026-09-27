import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { resumeBucket } from '../lib/dynamodb';
import { json, badRequest, serverError } from '../lib/response';
import { validateUploadRequest } from '../lib/validate';
import { userIdFromEvent } from '../lib/auth';

const s3 = new S3Client({});

// POST /upload-url
// The browser asks for a presigned URL, then uploads the resume
// straight to S3. The file never passes through Lambda, which keeps
// the API fast and avoids Lambda's 6 MB payload limit.
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  try {
    const userId = userIdFromEvent(event);
    const body = event.body ? JSON.parse(event.body) : null;
    const { errors, value } = validateUploadRequest(body);
    if (!value) return badRequest(errors);

    // Strip any path parts from the filename so a malicious name like
    // "../../etc/passwd" cannot escape the uploads/ prefix.
    const justName = value.filename.split(/[\\/]/).pop() ?? 'file'; // drop any path prefix
    const safeName = justName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `uploads/${userId}/${crypto.randomUUID()}-${safeName}`;

    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({ Bucket: resumeBucket(), Key: key, ContentType: value.contentType }),
      { expiresIn: 300 } // URL valid for 5 minutes
    );
    return json(200, { uploadUrl, key });
  } catch (err) {
    if (err instanceof SyntaxError) return badRequest(['body must be valid JSON']);
    return serverError(err);
  }
}
