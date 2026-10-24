import { ConstructionListStore } from './construction-list.store';
import { constructionCatalog } from './construction-catalog';
import { valheimImages } from '../../data/valheim-images';

describe('ConstructionListStore', () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('persists list changes and restores them from localStorage', () => {
        const store = new ConstructionListStore();
        const list = store.addList({
            title: 'Refúgio salvo',
            region: 'Pradarias',
            description: '',
            imageId: valheimImages[0].id
        });

        store.addConstruction(list.id, constructionCatalog[0]);
        store.updateItem(list.id, 'workbench', (item) => ({ ...item, completed: true }));
        store.addConstruction(list.id, constructionCatalog[0]);
        store.removeConstruction(list.id, 'workbench');

        const restoredStore = new ConstructionListStore();
        const restoredList = restoredStore.findById(list.id);

        expect(restoredList?.title).toBe('Refúgio salvo');
        expect(restoredList?.imageUrl).toBe(valheimImages[0].url);
        expect(restoredList?.imageThumbnailUrl).toBe(valheimImages[0].thumbnailUrl);
        expect(restoredList?.constructionItems).toEqual([]);
        expect(restoredList?.status).toBe('planning');
    });

    it('returns an empty list and reports invalid persisted data', () => {
        localStorage.setItem('varden.construction-lists.v1', '{invalid');
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        expect(new ConstructionListStore().lists()).toEqual([]);
        expect(error).toHaveBeenCalled();
    });

    it('stores a real creation timestamp and updates it when renamed', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-24T00:00:00.000Z'));
        const store = new ConstructionListStore();
        const list = store.addList({
            title: 'Refúgio salvo',
            region: 'Pradarias',
            description: '',
            imageId: valheimImages[0].id
        });

        expect(list.updatedAt).toBe('2026-10-24T00:00:00.000Z');
        vi.advanceTimersByTime(60_000);

        expect(store.renameList(list.id, '  Refúgio renovado  ')).toBe(true);
        expect(store.findById(list.id)?.title).toBe('Refúgio renovado');
        expect(store.findById(list.id)?.updatedAt).toBe('2026-10-24T00:01:00.000Z');

        const restoredStore = new ConstructionListStore();
        expect(restoredStore.findById(list.id)?.title).toBe('Refúgio renovado');
    });

    it('migrates previously saved creation labels to real timestamps', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-24T00:00:00.000Z'));
        const store = new ConstructionListStore();
        const list = store.addList({
            title: 'Lista antiga',
            region: 'Pradarias',
            description: '',
            imageId: valheimImages[0].id
        });
        const saved = JSON.parse(localStorage.getItem('varden.construction-lists.v1') ?? '{}') as {
            version: number;
            lists: Array<Record<string, unknown>>;
        };
        saved.lists[0]['updatedAt'] = 'Criada agora';
        localStorage.setItem('varden.construction-lists.v1', JSON.stringify(saved));

        const restoredStore = new ConstructionListStore();

        expect(restoredStore.findById(list.id)?.updatedAt).toBe('2026-10-24T00:00:00.000Z');
        const migrated = JSON.parse(
            localStorage.getItem('varden.construction-lists.v1') ?? '{}'
        ) as { lists: Array<Record<string, unknown>> };
        expect(migrated.lists[0]['updatedAt']).toBe('2026-10-24T00:00:00.000Z');
    });

    it('adds a thumbnail URL to existing saved lists without replacing their full cover', () => {
        const store = new ConstructionListStore();
        const list = store.addList({
            title: 'Lista antiga',
            region: 'Pradarias',
            description: '',
            imageId: valheimImages[0].id
        });
        const saved = JSON.parse(localStorage.getItem('varden.construction-lists.v1') ?? '{}') as {
            version: number;
            lists: Array<Record<string, unknown>>;
        };
        delete saved.lists[0]['imageThumbnailUrl'];
        localStorage.setItem('varden.construction-lists.v1', JSON.stringify(saved));

        const restoredList = new ConstructionListStore().findById(list.id);

        expect(restoredList?.imageUrl).toBe(valheimImages[0].url);
        expect(restoredList?.imageThumbnailUrl).toBe(valheimImages[0].thumbnailUrl);
    });

    it('rejects empty or overlong names without changing the list', () => {
        const store = new ConstructionListStore();
        const list = store.addList({
            title: 'Refúgio salvo',
            region: 'Pradarias',
            description: '',
            imageId: valheimImages[0].id
        });
        const originalUpdatedAt = list.updatedAt;

        expect(store.renameList(list.id, '   ')).toBe(false);
        expect(store.renameList(list.id, 'a'.repeat(101))).toBe(false);
        expect(store.findById(list.id)?.title).toBe('Refúgio salvo');
        expect(store.findById(list.id)?.updatedAt).toBe(originalUpdatedAt);
    });
});
