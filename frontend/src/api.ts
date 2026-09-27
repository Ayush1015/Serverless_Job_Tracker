import type { JobApplication } from './types';
import { fetchAuthSession } from 'aws-amplify/auth';

// The deployed API base URL, injected at build time (see .env.example).
const API_URL: string = import.meta.env.VITE_API_URL ?? '';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken?.toString();
  if (!idToken) throw new Error('Sign in to use the application tracker.');
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function listApplications(): Promise<{ items: JobApplication[] }> {
  return request('/applications');
}

export function createApplication(input: Partial<JobApplication>): Promise<JobApplication> {
  return request('/applications', { method: 'POST', body: JSON.stringify(input) });
}

export function updateApplication(id: string, patch: Partial<JobApplication>): Promise<JobApplication> {
  return request(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
}

export function deleteApplication(id: string): Promise<void> {
  return request(`/applications/${id}`, { method: 'DELETE' });
}

// Two-step upload: 1) get a presigned URL from our API, 2) PUT the file
// straight to S3. The file bytes never touch our Lambda.
export async function uploadResume(file: File): Promise<string> {
  const { uploadUrl, key } = await request<{ uploadUrl: string; key: string }>('/upload-url', {
    method: 'POST',
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  });
  const res = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
  if (!res.ok) throw new Error('Resume upload failed');
  return key;
}
