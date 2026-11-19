import Dexie, { type EntityTable } from 'dexie';

export interface LocalProject {
  id: string;
  title: string;
  basePhotoUrl?: string | null;
  artAssetUrl?: string | null;
  maskCanvasData?: string | null;
  cornerPoints: { x: number; y: number }[];
  blendMode: 'normal' | 'multiply' | 'overlay' | 'soft-light';
  opacity: number;
  brightness: number;
  contrast: number;
  synced: boolean;
  updatedAt: number;
}

export interface SyncQueueItem {
  id?: number;
  projectId: string;
  action: 'create' | 'update' | 'delete';
  payload: any;
  createdAt: number;
}

const db = new Dexie('MuralisDatabase') as Dexie & {
  projects: EntityTable<LocalProject, 'id'>;
  syncQueue: EntityTable<SyncQueueItem, 'id'>;
};

db.version(1).stores({
  projects: 'id, title, synced, updatedAt',
  syncQueue: '++id, projectId, action, createdAt'
});

export { db };
