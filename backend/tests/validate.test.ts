import { validateCreate, validateUpdate } from '../src/lib/validate';

describe('validateCreate', () => {
  it('accepts a minimal valid payload', () => {
    const { errors, value } = validateCreate({ company: ' Nike ', role: 'SWE' });
    expect(errors).toEqual([]);
    expect(value?.company).toBe('Nike'); // trims whitespace
  });

  it('flags a bad date format', () => {
    const { errors } = validateCreate({ company: 'Nike', role: 'SWE', appliedDate: '1st Sept 2026' });
    expect(errors.join(' ')).toContain('YYYY-MM-DD');
  });

  it('rejects non-object bodies', () => {
    expect(validateCreate('hello').errors.length).toBeGreaterThan(0);
    expect(validateCreate(null).errors.length).toBeGreaterThan(0);
  });
});

describe('validateUpdate', () => {
  it('accepts a single field', () => {
    const { errors, value } = validateUpdate({ status: 'REJECTED' });
    expect(errors).toEqual([]);
    expect(value).toEqual({ status: 'REJECTED' });
  });

  it('accepts a resume key and rejects a non-string value', () => {
    expect(validateUpdate({ resumeKey: 'uploads/resume.pdf' })).toEqual({
      errors: [],
      value: { resumeKey: 'uploads/resume.pdf' },
    });
    expect(validateUpdate({ resumeKey: 42 }).errors).toContain('resumeKey must be a string');
  });

  it('requires at least one field', () => {
    expect(validateUpdate({}).errors.join(' ')).toContain('at least one field');
  });
});
