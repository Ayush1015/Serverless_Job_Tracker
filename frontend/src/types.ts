export type ApplicationStatus = 'WISHLIST' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED';

export const STATUSES: ApplicationStatus[] = ['WISHLIST', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'];

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  jobUrl?: string;
  status: ApplicationStatus;
  appliedDate?: string;
  notes?: string;
  resumeKey?: string;
  createdAt: string;
  updatedAt: string;
}
