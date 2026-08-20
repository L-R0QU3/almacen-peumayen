import { describe, it, expect } from 'vitest';
import { calcMargin } from '../../src/services/productService.js';
import { MOVEMENT_EFFECT, MVP_MOVEMENT_TYPES } from '../../src/services/inventoryService.js';

describe('calcMargin', () => {
  it('calcula el margen porcentual sobre el precio de compra', () => {
    expect(calcMargin(1000, 1200)).toBe(20);
    expect(calcMargin(500, 750)).toBe(50);
    expect(calcMargin(800, 1000)).toBe(25);
  });

  it('retorna 0 si no hay precio de compra', () => {
    expect(calcMargin(0, 1000)).toBe(0);
    expect(calcMargin(null, 1000)).toBe(0);
  });

  it('soporta márgenes con decimales (2 dígitos)', () => {
    expect(calcMargin(333, 500)).toBeCloseTo(50.15, 1);
  });
});

describe('MOVEMENT_EFFECT (cantidades siempre positivas; el signo vive en backend)', () => {
  it('entradas suman stock', () => {
    expect(MOVEMENT_EFFECT.PURCHASE * 10).toBe(10);
    expect(MOVEMENT_EFFECT.RETURN * 5).toBe(5);
    expect(MOVEMENT_EFFECT.ADJUSTMENT_IN * 8).toBe(8);
  });

  it('salidas restan stock', () => {
    expect(MOVEMENT_EFFECT.SALE * 3).toBe(-3);
    expect(MOVEMENT_EFFECT.ADJUSTMENT_OUT * 2).toBe(-2);
  });

  it('SALE queda reservado (fuera del MVP)', () => {
    expect(MVP_MOVEMENT_TYPES).not.toContain('SALE');
  });
});
