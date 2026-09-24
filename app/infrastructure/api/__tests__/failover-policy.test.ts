import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ColdHostGate } from '../cold-host-gate.ts';
import { decideFailoverStep, isAbortError, sameHost } from '../failover-step.ts';

describe('ColdHostGate', () => {
  it('dua slot langsung, ketiga mengantri', async () => {
    const gate = new ColdHostGate(2);
    await gate.acquire();
    await gate.acquire();
    assert.equal(gate.inFlight, 2);
    assert.equal(gate.waiting, 0);

    let thirdEntered = false;
    const third = gate.acquire().then(() => {
      thirdEntered = true;
    });
    await Promise.resolve();
    assert.equal(thirdEntered, false);
    assert.equal(gate.waiting, 1);

    gate.release();
    await third;
    assert.equal(thirdEntered, true);
    assert.equal(gate.inFlight, 2);
    assert.equal(gate.waiting, 0);

    gate.release();
    gate.release();
    assert.equal(gate.inFlight, 0);
  });

  it('acquire baru tidak menyalip antrian yang sudah menunggu', async () => {
    const gate = new ColdHostGate(2);
    await gate.acquire();
    await gate.acquire();

    const late: number[] = [];
    const first = gate.acquire().then(() => late.push(1));
    const second = gate.acquire().then(() => late.push(2));
    await Promise.resolve();
    assert.equal(gate.waiting, 2);

    gate.release();
    await first;
    assert.deepEqual(late, [1]);

    let sneaked = false;
    const sneak = gate.acquire().then(() => {
      sneaked = true;
    });
    await Promise.resolve();
    assert.equal(sneaked, false);

    gate.release();
    await second;
    assert.equal(sneaked, false);

    gate.release();
    await sneak;
    assert.equal(sneaked, true);

    gate.release();
    gate.release();
    assert.equal(gate.inFlight, 0);
  });

  it('batal saat mengantri tidak memegang slot', async () => {
    const gate = new ColdHostGate(1);
    await gate.acquire();
    const signal = new AbortController();
    const waiting = gate.acquire(signal.signal);
    signal.abort();
    await assert.rejects(waiting, (error: unknown) => isAbortError(error));
    assert.equal(gate.waiting, 0);
    assert.equal(gate.inFlight, 1);

    gate.release();
    assert.equal(gate.inFlight, 0);
  });
});

describe('decideFailoverStep', () => {
  it('kegagalan di host aktif menggeser pin dan mengulang GET sekali', () => {
    assert.deepEqual(
      decideFailoverStep({
        replayable: true,
        replayed: false,
        failedOnActiveHost: true,
        hasNextTier: true,
      }),
      { advance: true, retry: true },
    );
  });

  it('request yang gagal di host lama ikut pin baru tanpa menggeser lagi', () => {
    assert.deepEqual(
      decideFailoverStep({
        replayable: true,
        replayed: false,
        failedOnActiveHost: false,
        hasNextTier: true,
      }),
      { advance: false, retry: true },
    );
  });

  it('percobaan kedua hanya menggeser pin, tidak membuka koneksi ketiga', () => {
    assert.deepEqual(
      decideFailoverStep({
        replayable: true,
        replayed: true,
        failedOnActiveHost: true,
        hasNextTier: true,
      }),
      { advance: true, retry: false },
    );
  });

  it('mutasi menggeser pin tanpa diulang', () => {
    assert.deepEqual(
      decideFailoverStep({
        replayable: false,
        replayed: false,
        failedOnActiveHost: true,
        hasNextTier: true,
      }),
      { advance: true, retry: false },
    );
  });

  it('mutasi yang gagal di host lama tidak menggeser pin', () => {
    assert.deepEqual(
      decideFailoverStep({
        replayable: false,
        replayed: false,
        failedOnActiveHost: false,
        hasNextTier: true,
      }),
      { advance: false, retry: false },
    );
  });

  it('tier terakhir tidak punya tujuan pindah', () => {
    assert.deepEqual(
      decideFailoverStep({
        replayable: true,
        replayed: false,
        failedOnActiveHost: true,
        hasNextTier: false,
      }),
      { advance: false, retry: false },
    );
  });
});

describe('sameHost / isAbortError', () => {
  it('mengabaikan garis miring di ujung', () => {
    assert.equal(sameHost('https://t1.test/api/v1/', 'https://t1.test/api/v1'), true);
    assert.equal(sameHost('https://t1.test', 'https://t2.test'), false);
  });

  it('mengenali batal axios dan abort DOM', () => {
    assert.equal(isAbortError(new DOMException('x', 'AbortError')), true);
    assert.equal(isAbortError({ code: 'ERR_CANCELED' }), true);
    assert.equal(isAbortError({ name: 'AxiosError', cause: { code: 'ERR_CANCELED' } }), true);
    assert.equal(isAbortError(new Error('network')), false);
  });
});
