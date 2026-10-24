import { TestBed } from '@angular/core/testing';
import { provideTestApi } from '../../../testing/in-memory-api';
import { valheimImages } from '../../data/valheim-images';
import { ConstructionListStore } from './construction-list.store';
import { constructionCatalog } from './construction-catalog';

describe('ConstructionListStore', () => {
    beforeEach(async () => {
        localStorage.clear();
        await TestBed.configureTestingModule({ providers: provideTestApi() }).compileComponents();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('persists construction changes through the list API and reloads them', async () => {
        const store = TestBed.inject(ConstructionListStore);
        const list = await store.addList({
            title: 'Refúgio salvo',
            region: 'Pradarias',
            description: '',
            imageId: valheimImages[0].id
        });
        if (!list) {
            throw new Error('The API did not create the list.');
        }

        expect(list.decomposeMaterials).toBe(true);
        expect(await store.setDecomposeMaterials(list.id, false)).toBe(true);
        await store.addConstruction(list.id, constructionCatalog[0]);
        await store.updateItem(list.id, 'workbench', (item) => ({ ...item, completed: true }));
        await store.addConstruction(list.id, constructionCatalog[0]);
        await store.removeConstruction(list.id, 'workbench');
        await store.loadLists();

        const restoredList = store.findById(list.id);
        expect(restoredList?.title).toBe('Refúgio salvo');
        expect(restoredList?.decomposeMaterials).toBe(false);
        expect(restoredList?.imageUrl).toBe(valheimImages[0].url);
        expect(restoredList?.imageThumbnailUrl).toBe(valheimImages[0].thumbnailUrl);
        expect(restoredList?.constructionItems).toEqual([]);
        expect(restoredList?.status).toBe('planning');
    });

    it('deletes a list through the API and keeps other lists', async () => {
        const store = TestBed.inject(ConstructionListStore);
        const firstList = await store.addList({
            title: 'Primeira lista',
            region: 'Pradarias',
            description: '',
            imageId: valheimImages[0].id
        });
        const secondList = await store.addList({
            title: 'Segunda lista',
            region: 'Floresta Negra',
            description: '',
            imageId: valheimImages[0].id
        });
        if (!firstList || !secondList) {
            throw new Error('The API did not create the test lists.');
        }

        expect(await store.deleteList(firstList.id)).toBe(true);
        expect(await store.deleteList('lista-inexistente')).toBe(false);
        await store.loadLists();
        expect(store.lists().map((list) => list.id)).toEqual([secondList.id]);
    });

    it('stores a real creation timestamp and updates it when renamed', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-24T00:00:00.000Z'));
        const store = TestBed.inject(ConstructionListStore);
        const list = await store.addList({
            title: 'Refúgio salvo',
            region: 'Pradarias',
            description: '',
            imageId: valheimImages[0].id
        });
        if (!list) {
            throw new Error('The API did not create the test list.');
        }

        expect(list.updatedAt).toBe('2026-10-24T00:00:00.000Z');
        vi.advanceTimersByTime(60_000);

        expect(await store.renameList(list.id, '  Refúgio renovado  ')).toBe(true);
        expect(store.findById(list.id)?.title).toBe('Refúgio renovado');
        expect(store.findById(list.id)?.updatedAt).toBe('2026-10-24T00:01:00.000Z');

        await store.loadLists();
        expect(store.findById(list.id)?.title).toBe('Refúgio renovado');
    });

    it('rejects empty or overlong names without changing the list', async () => {
        const store = TestBed.inject(ConstructionListStore);
        const list = await store.addList({
            title: 'Refúgio salvo',
            region: 'Pradarias',
            description: '',
            imageId: valheimImages[0].id
        });
        if (!list) {
            throw new Error('The API did not create the test list.');
        }
        const originalUpdatedAt = list.updatedAt;

        expect(await store.renameList(list.id, '   ')).toBe(false);
        expect(await store.renameList(list.id, 'a'.repeat(101))).toBe(false);
        expect(store.findById(list.id)?.title).toBe('Refúgio salvo');
        expect(store.findById(list.id)?.updatedAt).toBe(originalUpdatedAt);
    });

    it('offers an explicit, non-destructive import of older browser lists', async () => {
        const legacyList = {
            id: '8a70c452-d0d7-4f6b-b5b6-4d4aaf0e2854',
            title: 'Lista antiga',
            region: 'Pradarias',
            description: 'Salva no navegador',
            completedUnits: 0,
            totalUnits: 0,
            buildings: 0,
            progress: 0,
            updatedAt: '2026-10-23T00:00:00.000Z',
            imageUrl: valheimImages[0].url,
            imageAlt: valheimImages[0].alt,
            priority: false,
            status: 'planning',
            updatedOrder: 1,
            constructionItems: []
        };
        localStorage.setItem(
            'varden.construction-lists.v1',
            JSON.stringify({ version: 1, lists: [legacyList] })
        );
        const store = TestBed.inject(ConstructionListStore);

        await store.loadLists();
        expect(store.legacyListsAvailable()).toBe(true);
        await store.importLegacyLists();

        expect(store.findById(legacyList.id)?.title).toBe('Lista antiga');
        expect(store.findById(legacyList.id)?.isShared).toBe(false);
        expect(store.findById(legacyList.id)?.decomposeMaterials).toBe(true);
        expect(store.legacyListsAvailable()).toBe(false);
        expect(localStorage.getItem('varden.construction-lists.v1')).not.toBeNull();
    });
});
