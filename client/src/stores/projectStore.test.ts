import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useProjectStore } from './projectStore.js';
import { db } from '../services/offlineDb.js';

describe('projectStore local-first workflows', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await db.projects.clear();
  });

  it('creates, saves, loads, and duplicates a mural locally without API', async () => {
    const store = useProjectStore();
    const id = await store.createProject('Fachada Escola');

    expect(id.startsWith('local_')).toBe(true);
    expect(store.currentProject.title).toBe('Fachada Escola');
    expect(store.currentProject.isDirty).toBe(false);

    store.setArtAsset('data:image/png;base64,AAA');
    store.setBlendMode('overlay');
    expect(store.currentProject.isDirty).toBe(true);
    await store.saveProject();

    store.resetProject();
    expect(store.currentProject.id).toBeNull();

    await store.loadProject(id);
    expect(store.currentProject.id).toBe(id);
    expect(store.currentProject.title).toBe('Fachada Escola');
    expect(store.currentProject.blendMode).toBe('overlay');
    expect(store.currentProject.artAssetUrl).toBe('data:image/png;base64,AAA');

    const copyId = await store.duplicateProject(id);
    expect(copyId).not.toBeNull();
    expect(copyId).not.toBe(id);

    const all = await db.projects.toArray();
    expect(all).toHaveLength(2);
    const copy = all.find((p) => p.id === copyId);
    expect(copy?.title).toBe('Fachada Escola (Cópia)');
  });

  it('handles undo and redo history boundaries safely', () => {
    const store = useProjectStore();
    store.pushHistory();
    store.setCornerPoint(0, { x: 0.3, y: 0.3 });
    store.pushHistory();

    expect(store.currentProject.cornerPoints[0]).toEqual({ x: 0.3, y: 0.3 });
    store.undo();
    expect(store.currentProject.cornerPoints[0]).toEqual({ x: 0.15, y: 0.15 });
    store.undo();
    expect(store.currentProject.cornerPoints[0]).toEqual({ x: 0.15, y: 0.15 });

    store.redo();
    expect(store.currentProject.cornerPoints[0]).toEqual({ x: 0.3, y: 0.3 });
    store.redo();
    expect(store.currentProject.cornerPoints[0]).toEqual({ x: 0.3, y: 0.3 });
  });

  it('ignores out-of-range corner indices and missing project loads', async () => {
    const store = useProjectStore();
    const initial = JSON.parse(JSON.stringify(store.currentProject.cornerPoints));

    store.setCornerPoint(-1, { x: 0.9, y: 0.9 });
    store.setCornerPoint(4, { x: 0.9, y: 0.9 });
    expect(store.currentProject.cornerPoints).toEqual(initial);

    await store.loadProject('non_existent_id');
    expect(store.currentProject.id).toBeNull();

    const dup = await store.duplicateProject('non_existent_id');
    expect(dup).toBeNull();
  });
});
