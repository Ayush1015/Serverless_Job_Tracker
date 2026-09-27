// Domain types shared by all handlers.

export type ApplicationStatus = 'WISHLIST' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED';

export const STATUSES: ApplicationStatus[] = ['WISHLIST', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'];

export interface JobApplication {
  id: string;              // UUID, also the DynamoDB partition key
  userId: string;          // Cognito sub claim that owns this application
  company: string;
  role: string;
  jobUrl?: string;
  status: ApplicationStatus;
  appliedDate?: string;    // YYYY-MM-DD
  notes?: string;
  resumeKey?: string;      // S3 object key of the uploaded resume PDF
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
}
