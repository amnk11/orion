import { describe, it, expect, beforeEach } from 'vitest';
import "fake-indexeddb/auto";
import { db } from './db';

describe('OfflineDB (IndexedDB)', () => {
  beforeEach(async () => {
    // Clear all tables before each test
    await db.localHandoffs.clear();
    await db.mutationQueue.clear();
    await db.referenceCache.clear();
  });

  it('initializes successfully', () => {
    expect(db.isOpen()).toBe(true);
    expect(db.name).toBe('OrionOfflineDB');
  });

  it('can insert and retrieve localHandoffs', async () => {
    const handoff = {
      id: 'h1',
      clientMutationId: 'c1',
      patientId: 'p1',
      episodeId: 'e1',
      assessmentId: 'a1',
      payload: {
        protocolCode: 'anc_danger',
        destinationFacilityId: 'dest1',
        packetJson: {}
      },
      syncStatus: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.localHandoffs.add(handoff);
    const retrieved = await db.localHandoffs.get('h1');
    expect(retrieved).toEqual(handoff);
  });

  it('can update localHandoffs status', async () => {
    await db.localHandoffs.add({
      id: 'h2',
      clientMutationId: 'c2',
      patientId: 'p2',
      episodeId: 'e2',
      assessmentId: 'a2',
      payload: { protocolCode: 'x', destinationFacilityId: 'y', packetJson: {} },
      syncStatus: 'pending',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    });

    await db.localHandoffs.update('h2', { syncStatus: 'synced' });
    const retrieved = await db.localHandoffs.get('h2');
    expect(retrieved?.syncStatus).toBe('synced');
  });

  it('can insert and preserve createdAt ordering in mutationQueue', async () => {
    const time1 = new Date('2023-01-01T10:00:00Z').toISOString();
    const time2 = new Date('2023-01-01T11:00:00Z').toISOString();

    await db.mutationQueue.add({
      id: 'm2',
      clientMutationId: 'c2',
      mutationType: 'create_patient',
      payload: {},
      status: 'pending',
      attempts: 0,
      nextAttemptAt: Date.now(),
      createdAt: time2,
      updatedAt: time2
    });

    await db.mutationQueue.add({
      id: 'm1',
      clientMutationId: 'c1',
      mutationType: 'create_handoff',
      payload: {},
      status: 'pending',
      attempts: 0,
      nextAttemptAt: Date.now(),
      createdAt: time1,
      updatedAt: time1
    });

    const ordered = await db.mutationQueue.orderBy('createdAt').toArray();
    expect(ordered[0].id).toBe('m1');
    expect(ordered[1].id).toBe('m2');
  });

  it('mutationQueue records can transition pending -> syncing -> synced', async () => {
    const id = 'm_transition';
    await db.mutationQueue.add({
      id,
      clientMutationId: id,
      mutationType: 'create_patient',
      payload: {},
      status: 'pending',
      attempts: 0,
      nextAttemptAt: 0,
      createdAt: '2023',
      updatedAt: '2023'
    });

    await db.mutationQueue.update(id, { status: 'syncing' });
    let record = await db.mutationQueue.get(id);
    expect(record?.status).toBe('syncing');

    await db.mutationQueue.update(id, { status: 'synced' });
    record = await db.mutationQueue.get(id);
    expect(record?.status).toBe('synced');
  });

  it('failed mutations can be marked error', async () => {
    const id = 'm_fail';
    await db.mutationQueue.add({
      id,
      clientMutationId: id,
      mutationType: 'create_patient',
      payload: {},
      status: 'pending',
      attempts: 0,
      nextAttemptAt: 0,
      createdAt: '2023',
      updatedAt: '2023'
    });

    await db.mutationQueue.update(id, { status: 'failed', lastError: 'Network err' });
    const record = await db.mutationQueue.get(id);
    expect(record?.status).toBe('failed');
    expect(record?.lastError).toBe('Network err');
  });

  it('referenceCache can store and retrieve cached data', async () => {
    const data = [{ id: 'f1', name: 'Facility 1' }];
    await db.referenceCache.put({ key: 'facilities', data, cachedAt: 12345 });
    
    const cached = await db.referenceCache.get('facilities');
    expect(cached?.data).toEqual(data);
    expect(cached?.cachedAt).toBe(12345);
  });

  it('survives normal read/write lifecycle', async () => {
    await db.localHandoffs.add({
      id: 'x',
      clientMutationId: 'x',
      patientId: 'x',
      episodeId: 'x',
      assessmentId: 'x',
      payload: { protocolCode: 'x', destinationFacilityId: 'x', packetJson: {} },
      syncStatus: 'pending',
      createdAt: 'x',
      updatedAt: 'x'
    });

    const handoffs = await db.localHandoffs.toArray();
    expect(handoffs.length).toBe(1);

    await db.localHandoffs.delete('x');
    const handoffsAfter = await db.localHandoffs.toArray();
    expect(handoffsAfter.length).toBe(0);
  });
});
