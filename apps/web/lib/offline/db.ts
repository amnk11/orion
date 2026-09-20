import Dexie, { type Table } from 'dexie';

export interface LocalHandoff {
  id: string; // The handoff ID
  clientMutationId: string; // The mutation queue reference
  patientId: string;
  episodeId: string;
  assessmentId: string;
  payload: {
    protocolCode: string;
    destinationFacilityId: string;
    packetJson: Record<string, any>;
  };
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
  serverId?: string; // set when reconciled
  publicCode?: string; // set when reconciled
  errorDetails?: any;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface MutationQueueItem {
  id: string; // Random UUID
  clientMutationId: string; // Random UUID tying to the local Handoff
  mutationType: 'create_handoff' | 'create_patient';
  payload: any; // e.g. { id, episodeId, assessmentId, patientId, ... }
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
  attempts: number;
  nextAttemptAt: number; // timestamp
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceCacheItem {
  key: string; // e.g. 'facilities' or 'capabilities'
  data: any;
  cachedAt: number;
}

export class OfflineDB extends Dexie {
  localHandoffs!: Table<LocalHandoff, string>;
  mutationQueue!: Table<MutationQueueItem, string>;
  referenceCache!: Table<ReferenceCacheItem, string>;

  constructor() {
    super('OrionOfflineDB');
    this.version(1).stores({
      localHandoffs: 'id, clientMutationId, syncStatus, createdAt',
      mutationQueue: 'id, clientMutationId, status, nextAttemptAt, createdAt',
      referenceCache: 'key, cachedAt'
    });
  }
}

export const db = new OfflineDB();
