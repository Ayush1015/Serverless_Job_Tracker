import { STATUSES, type ApplicationStatus } from '../types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export interface CreateInput {
  company: string;
  role: string;
  jobUrl?: string;
  status: ApplicationStatus;
  appliedDate?: string;
  notes?: string;
}

export interface UpdateInput {
  company?: string;
  role?: string;
  jobUrl?: string;
  status?: ApplicationStatus;
  appliedDate?: string;
  notes?: string;
  resumeKey?: string;
}

function checkCommon(input: Record<string, unknown>, errors: string[], requireCore: boolean): void {
  if (requireCore) {
    if (typeof input.company !== 'string' || input.company.trim() === '') errors.push('company is required');
    if (typeof input.role !== 'string' || input.role.trim() === '') errors.push('role is required');
  } else {
    if (input.company !== undefined && (typeof input.company !== 'string' || input.company.trim() === ''))
      errors.push('company must be a non-empty string');
    if (input.role !== undefined && (typeof input.role !== 'string' || input.role.trim() === ''))
      errors.push('role must be a non-empty string');
  }
  if (input.status !== undefined && !STATUSES.includes(input.status as ApplicationStatus))
    errors.push(`status must be one of ${STATUSES.join(', ')}`);
  if (input.jobUrl !== undefined && (typeof input.jobUrl !== 'string' || !isHttpUrl(input.jobUrl)))
    errors.push('jobUrl must be a valid http(s) URL');
  if (input.appliedDate !== undefined && (typeof input.appliedDate !== 'string' || !DATE_RE.test(input.appliedDate)))
    errors.push('appliedDate must be YYYY-MM-DD');
  if (input.notes !== undefined && typeof input.notes !== 'string') errors.push('notes must be a string');
}

export function validateCreate(input: unknown): { errors: string[]; value?: CreateInput } {
  const errors: string[] = [];
  if (typeof input !== 'object' || input === null) return { errors: ['body must be a JSON object'] };
  const body = input as Record<string, unknown>;
  checkCommon(body, errors, true);
  if (errors.length > 0) return { errors };
  return {
    errors,
    value: {
      company: (body.company as string).trim(),
      role: (body.role as string).trim(),
      status: (body.status as ApplicationStatus) ?? 'APPLIED',
      ...(body.jobUrl ? { jobUrl: body.jobUrl as string } : {}),
      ...(body.appliedDate ? { appliedDate: body.appliedDate as string } : {}),
      ...(body.notes ? { notes: body.notes as string } : {}),
    },
  };
}

export function validateUpdate(input: unknown): { errors: string[]; value?: UpdateInput } {
  const errors: string[] = [];
  if (typeof input !== 'object' || input === null) return { errors: ['body must be a JSON object'] };
  const body = input as Record<string, unknown>;
  checkCommon(body, errors, false);
  if (body.resumeKey !== undefined && typeof body.resumeKey !== 'string') errors.push('resumeKey must be a string');
  const keys = ['company', 'role', 'jobUrl', 'status', 'appliedDate', 'notes', 'resumeKey'] as const;
  if (!keys.some((k) => body[k] !== undefined)) errors.push('at least one field must be provided');
  if (errors.length > 0) return { errors };
  const value: UpdateInput = {};
  for (const k of keys) if (body[k] !== undefined) (value as Record<string, unknown>)[k] = body[k];
  return { errors, value };
}

const ALLOWED_RESUME_TYPES = ['application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export function validateUploadRequest(input: unknown): { errors: string[]; value?: { filename: string; contentType: string } } {
  const errors: string[] = [];
  if (typeof input !== 'object' || input === null) return { errors: ['body must be a JSON object'] };
  const body = input as Record<string, unknown>;
  if (typeof body.filename !== 'string' || body.filename.trim() === '') errors.push('filename is required');
  if (typeof body.contentType !== 'string' || !ALLOWED_RESUME_TYPES.includes(body.contentType))
    errors.push(`contentType must be one of ${ALLOWED_RESUME_TYPES.join(', ')}`);
  if (errors.length > 0) return { errors };
  return { errors, value: { filename: (body.filename as string).trim(), contentType: body.contentType as string } };
}
