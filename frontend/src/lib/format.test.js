import { describe, it, expect } from 'vitest';
import { formatCLP, formatDate, formatDateTime, todayISO } from './format.js';

describe('formatCLP (es-CL, sin decimales)', () => {
  it('formatea valores CLP', () => {
    expect(formatCLP(1500)).toBe('$1.500');
    expect(formatCLP(15990)).toBe('$15.990');
    expect(formatCLP(1250000)).toBe('$1.250.000');
  });

  it('maneja valores nulos/indefinidos', () => {
    expect(formatCLP(null)).toBe('$0');
    expect(formatCLP(undefined)).toBe('$0');
  });
});

describe('formatDate (DD/MM/YYYY)', () => {
  it('formatea fechas ISO', () => {
    expect(formatDate('2026-08-15')).toBe('15/08/2026');
  });

  it('maneja valores vacíos e inválidos', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('no-es-fecha')).toBe('—');
  });
});

describe('formatDateTime', () => {
  it('incluye hora y minuto en formato 24h', () => {
    const out = formatDateTime('2026-08-15T14:30:00');
    expect(out).toBe('15/08/2026 14:30');
  });
});

describe('todayISO', () => {
  it('devuelve la fecha actual en formato ISO', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
