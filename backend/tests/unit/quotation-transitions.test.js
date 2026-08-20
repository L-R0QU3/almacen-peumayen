import { describe, it, expect } from 'vitest';
import { TRANSITIONS } from '../../src/services/quotationService.js';
import { QUOTATION_STATUSES } from '../../src/schemas/quotation.schema.js';

describe('Transiciones de estado de cotizaciones', () => {
  it('cubre todos los estados del modelo', () => {
    for (const status of QUOTATION_STATUSES) {
      expect(TRANSITIONS[status]).toBeDefined();
    }
  });

  it('BORRADOR solo puede pasar a ENVIADA', () => {
    expect(TRANSITIONS.BORRADOR).toEqual(['ENVIADA']);
  });

  it('ENVIADA solo puede pasar a ACEPTADA o RECHAZADA', () => {
    expect(TRANSITIONS.ENVIADA.sort()).toEqual(['ACEPTADA', 'RECHAZADA'].sort());
  });

  it('CONVERTIDA_A_VENTA no se alcanza por transición manual (requiere módulo ventas)', () => {
    expect(TRANSITIONS.ACEPTADA).toEqual([]);
    expect(TRANSITIONS.CONVERTIDA_A_VENTA).toEqual([]);
  });

  it('VENCIDA es un estado del sistema, no una transición manual', () => {
    expect(TRANSITIONS.VENCIDA).toEqual([]);
  });
});
