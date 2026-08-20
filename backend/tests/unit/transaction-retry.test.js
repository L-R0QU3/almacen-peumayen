import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock del pool para simular deadlocks sin tocar la base de datos
const { poolMock } = vi.hoisted(() => {
  const pool = { connect: vi.fn() };
  return { poolMock: pool };
});

vi.mock('../../src/db/pool.js', () => ({ pool: poolMock }));

import { withTransactionRetry } from '../../src/db/transactions.js';

function fakeClient() {
  return { query: vi.fn(async () => ({})), release: vi.fn() };
}

function pgError(code, message) {
  return Object.assign(new Error(message), { code });
}

describe('withTransactionRetry (estrategia de concurrencia, punto 17)', () => {
  beforeEach(() => {
    poolMock.connect.mockReset();
  });

  it('reintenta ante deadlock (40P01) y termina con éxito', async () => {
    let calls = 0;
    poolMock.connect.mockImplementation(async () => {
      calls += 1;
      if (calls < 3) throw pgError('40P01', 'deadlock detected');
      return fakeClient();
    });

    const result = await withTransactionRetry(async () => 'ok');
    expect(calls).toBe(3); // 2 fallos + 1 éxito
    expect(result).toBe('ok');
  });

  it('reintenta ante serialización (40001)', async () => {
    let calls = 0;
    poolMock.connect.mockImplementation(async () => {
      calls += 1;
      if (calls === 1) throw pgError('40001', 'could not serialize');
      return fakeClient();
    });

    await withTransactionRetry(async () => 'ok');
    expect(calls).toBe(2);
  });

  it('no reintenta errores no recuperables (los propaga)', async () => {
    poolMock.connect.mockImplementation(async () => {
      throw new Error('error de negocio');
    });
    await expect(withTransactionRetry(async () => {})).rejects.toThrow('error de negocio');
    expect(poolMock.connect).toHaveBeenCalledTimes(1);
  });
});
