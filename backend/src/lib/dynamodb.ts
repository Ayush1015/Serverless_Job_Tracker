import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// One low-level client, wrapped by the DocumentClient which handles
// marshalling (plain JS objects <-> DynamoDB AttributeValue maps) for us.
// Reusing the client across warm Lambda invocations avoids reconnect cost.
const client = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(client);

// Read env at call time (not module load) so tests can set it per case.
export function tableName(): string {
  return process.env.TABLE_NAME ?? 'job-applications';
}

export function applicationsIndexName(): string {
  return process.env.APPLICATIONS_INDEX ?? 'UserIdCreatedAtIndex';
}

export function resumeBucket(): string {
  return process.env.RESUME_BUCKET ?? 'job-tracker-resumes';
}
