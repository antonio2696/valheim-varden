import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { RouterLink } from '@angular/router';
import { routes } from '../../app.routes';
import { valheimImages } from '../../data/valheim-images';
import { valheimDatabaseItems } from '../../data/item-database';
import { ConstructionListStore } from '../home/construction-list.store';
import { constructionCatalog } from '../home/construction-catalog';
import { Home } from '../home/home';
import { ViewList } from './view-list';
import { provideTestApi } from '../../../testing/in-memory-api';

describe('ViewList route', () => {
    beforeEach(async () => {
        localStorage.clear();
        await TestBed.configureTestingModule({
            providers: [...provideTestApi(), provideRouter(routes)]
        }).compileComponents();
    });

    it('opens the list details from the home card', async () => {
        const list = await TestBed.inject(ConstructionListStore).addList({
            title: 'Refúgio de teste',
            region: 'Pradarias',
            description: 'Lista de teste',
            imageId: valheimImages[0].id
        });
        if (!list) {
            throw new Error('The API did not create the test list.');
        }
        const harness = await RouterTestingHarness.create();
        const navigation = harness.navigateByUrl('/home', Home);
        await navigation;
        harness.detectChanges();

        const openButton = harness.routeDebugElement
            ?.queryAll(By.directive(RouterLink))
            .find((element) =>
                element.injector.get(RouterLink).urlTree?.toString().startsWith('/view-list/')
            );
        expect(openButton).toBeTruthy();
        openButton?.nativeElement.click();
        await harness.fixture.whenStable();
        harness.detectChanges();

        expect(TestBed.inject(Router).url).toBe(`/view-list/${list?.id}`);
        expect(harness.routeNativeElement?.textContent).toContain(list?.title);
    });

    it('renders details for a list UUID route', async () => {
        const listStore = TestBed.inject(ConstructionListStore);
        const list = await listStore.addList({
            title: 'Refúgio de teste',
            region: 'Pradarias',
            description: 'Lista de teste',
            imageId: valheimImages[0].id
        });
        if (!list) {
            throw new Error('The API did not create the test list.');
        }
        await listStore.addConstruction(list.id, constructionCatalog[0]);
        const harness = await RouterTestingHarness.create();
        const component = await harness.navigateByUrl(`/view-list/${list.id}`, ViewList);

        expect(component.list()?.title).toBe(list.title);
        expect(harness.routeNativeElement?.textContent).toContain('Bancada de trabalho');
    });

    it('confirms list deletion and returns to home after deleting', async () => {
        const listStore = TestBed.inject(ConstructionListStore);
        const list = await listStore.addList({
            title: 'Refúgio de teste',
            region: 'Pradarias',
            description: 'Lista de teste',
            imageId: valheimImages[0].id
        });
        if (!list) {
            throw new Error('The API did not create the test list.');
        }
        const confirm = vi
            .spyOn(window, 'confirm')
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true);
        const harness = await RouterTestingHarness.create();
        await harness.navigateByUrl(`/view-list/${list.id}`, ViewList);
        harness.detectChanges();

        const deleteButton = harness.routeNativeElement?.querySelector(
            'button[aria-label="Excluir lista Refúgio de teste"]'
        ) as HTMLButtonElement;
        deleteButton.click();
        expect(listStore.findById(list.id)).toBeDefined();
        expect(TestBed.inject(Router).url).toBe(`/view-list/${list.id}`);

        deleteButton.click();
        await harness.fixture.whenStable();
        harness.detectChanges();

        expect(listStore.findById(list.id)).toBeUndefined();
        expect(TestBed.inject(Router).url).toBe('/my-lists');
        expect(harness.routeNativeElement?.textContent).toContain('Minhas listas');
        expect(confirm).toHaveBeenCalledTimes(2);
    });

    it('lets the owner share a list and control collaborative editing', async () => {
        const list = await TestBed.inject(ConstructionListStore).addList({
            title: 'Projeto conjunto',
            region: 'Pradarias',
            description: '',
            imageId: valheimImages[0].id
        });
        if (!list) {
            throw new Error('The API did not create the test list.');
        }
        const harness = await RouterTestingHarness.create();
        const component = await harness.navigateByUrl(`/view-list/${list.id}`, ViewList);

        await component.setShared(true);
        expect(component.list()?.isShared).toBe(true);
        await component.setCollaborativeEditing(true);
        expect(component.list()?.allowEditing).toBe(true);
        await component.setShared(false);
        expect(component.list()?.isShared).toBe(false);
    });

    it('searches the local database in Portuguese and English and adds recipe data', async () => {
        const listStore = TestBed.inject(ConstructionListStore);
        const list = await listStore.addList({
            title: 'Receitas',
            region: 'Pradarias',
            description: '',
            imageId: valheimImages[0].id
        });
        if (!list) {
            throw new Error('The API did not create the test list.');
        }
        const harness = await RouterTestingHarness.create();
        const component = await harness.navigateByUrl(`/view-list/${list.id}`, ViewList);

        component.search.set('boar meat');
        const englishMatch = component
            .matchingCatalog()
            .find((entry) => entry.id === 'recipe_cooked_boar_meat');
        expect(englishMatch?.name).toBe('Carne de javali cozida');

        component.search.set('carne de javali cozida');
        const portugueseMatch = component
            .matchingCatalog()
            .find((entry) => entry.id === 'recipe_cooked_boar_meat');
        expect(portugueseMatch?.nameEn).toBe('Cooked boar meat');
        expect(valheimDatabaseItems).toHaveLength(459);

        component.search.set('fire resistance');
        const meadMatch = component
            .matchingCatalog()
            .find((entry) => entry.id === 'mead_fire_resistance_barley_wine');
        expect(meadMatch?.name).toBe('Vinho de cevada de resistência ao fogo');
        expect(meadMatch?.unitDescription).toContain('Rendimento: 6');
        expect(meadMatch?.unitDescription).toContain('Efeito: Resistência ao fogo');

        component.search.set('carne de javali cozida');
        if (!portugueseMatch) {
            throw new Error('The Portuguese recipe search did not return the database item.');
        }
        component.addFromCatalog(portugueseMatch);
        await harness.fixture.whenStable();

        const addedItem = listStore.findById(list.id)?.constructionItems[0];
        expect(addedItem?.materials.length).toBeGreaterThan(0);
        expect(addedItem?.unitDescription).toContain('Estação:');
        expect(component.search()).toBe('');
    });

    it('decomposes intermediate recipes and persists the per-list preference', async () => {
        const listStore = TestBed.inject(ConstructionListStore);
        const list = await listStore.addList({
            title: 'Ensopado',
            region: 'Montanhas',
            description: '',
            imageId: valheimImages[0].id
        });
        if (!list) {
            throw new Error('The API did not create the test list.');
        }
        const harness = await RouterTestingHarness.create();
        const component = await harness.navigateByUrl(`/view-list/${list.id}`, ViewList);
        const stew = constructionCatalog.find(
            (item) => item.id === 'recipe_hearty_mountain_logger_s_stew'
        );
        if (!stew) {
            throw new Error('The hearty stew recipe was not found in the catalog.');
        }

        component.addFromCatalog(stew);
        await harness.fixture.whenStable();
        harness.detectChanges();

        const addedStew = listStore.findById(list.id)?.constructionItems[0];
        if (!addedStew) {
            throw new Error('The hearty stew was not added to the test list.');
        }
        expect(component.list()?.decomposeMaterials).toBe(true);
        expect(component.materials()).toEqual(
            expect.arrayContaining([
                { name: 'Carne de lobo', total: 2, remaining: 2 },
                { name: 'Cogumelo', total: 4, remaining: 4 },
                { name: 'Cebola', total: 11, remaining: 11 },
                { name: 'Cenoura', total: 4, remaining: 4 },
                { name: 'Pimenta em pó das montanhas', total: 1, remaining: 1 }
            ])
        );
        expect(component.formatTotalMaterials(addedStew)).not.toContain('Espetinho de lobo');
        expect(component.formatTotalMaterials(addedStew)).not.toContain('Sopa de cebola');

        const checkbox = harness.routeNativeElement?.querySelector(
            'input[type="checkbox"]'
        ) as HTMLInputElement;
        expect(checkbox.checked).toBe(true);
        checkbox.click();
        await harness.fixture.whenStable();
        harness.detectChanges();

        expect(component.list()?.decomposeMaterials).toBe(false);
        expect(component.materials()).toEqual(
            expect.arrayContaining([
                { name: 'Espetinho de lobo', total: 2, remaining: 2 },
                { name: 'Sopa de cebola', total: 3, remaining: 3 }
            ])
        );
        await listStore.loadLists();
        expect(listStore.findById(list.id)?.decomposeMaterials).toBe(false);
    });

    it('counts recipe batches using output quantities', async () => {
        const listStore = TestBed.inject(ConstructionListStore);
        const list = await listStore.addList({
            title: 'Hidromel',
            region: 'Pradarias',
            description: '',
            imageId: valheimImages[0].id
        });
        if (!list) {
            throw new Error('The API did not create the test list.');
        }
        const harness = await RouterTestingHarness.create();
        const component = await harness.navigateByUrl(`/view-list/${list.id}`, ViewList);
        const mead = constructionCatalog.find((item) => item.id === 'mead_minor_healing_mead');
        if (!mead) {
            throw new Error('The mead recipe was not found in the catalog.');
        }

        component.addFromCatalog(mead);
        await harness.fixture.whenStable();
        await listStore.updateItem(list.id, mead.id, (item) => ({ ...item, quantity: 7 }));
        await listStore.setDecomposeMaterials(list.id, false);

        expect(component.materials()).toEqual(
            expect.arrayContaining([
                { name: 'Mel', total: 20, remaining: 20 },
                { name: 'Mirtilos', total: 10, remaining: 10 },
                { name: 'Framboesa', total: 20, remaining: 20 },
                { name: 'Dente-de-leão', total: 2, remaining: 2 }
            ])
        );
    });

    it('adds autocomplete results with Enter without delaying local search', async () => {
        const listStore = TestBed.inject(ConstructionListStore);
        const list = await listStore.addList({
            title: 'Armaduras',
            region: 'Montanhas',
            description: '',
            imageId: valheimImages[0].id
        });
        if (!list) {
            throw new Error('The API did not create the test list.');
        }
        const harness = await RouterTestingHarness.create();
        const component = await harness.navigateByUrl(`/view-list/${list.id}`, ViewList);
        component.search.set('capa de odin');

        expect(
            component.matchingCatalog().some((entry) => entry.id === 'armor_cape_of_odin_dlc')
        ).toBe(true);
        const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
        component.handleSearchKeydown(enter);
        await harness.fixture.whenStable();

        const addedArmor = listStore.findById(list.id)?.constructionItems[0];
        expect(enter.defaultPrevented).toBe(true);
        expect(addedArmor?.name).toBe('Capa de Odin');
        expect(addedArmor?.unitDescription).toContain('Armadura:');
    });

    it('searches and adds weapon data from the bilingual weapons catalog', async () => {
        const listStore = TestBed.inject(ConstructionListStore);
        const list = await listStore.addList({
            title: 'Armas',
            region: 'Pradarias',
            description: '',
            imageId: valheimImages[0].id
        });
        if (!list) {
            throw new Error('The API did not create the test list.');
        }
        const harness = await RouterTestingHarness.create();
        const component = await harness.navigateByUrl(`/view-list/${list.id}`, ViewList);
        component.search.set('mistwalker');

        const match = component.matchingCatalog().find((entry) => entry.id === 'weapon_mistwalker');
        expect(match?.name).toBe('Caminhante da névoa');
        expect(match?.unitDescription).toBe('Categoria: Espadas');
        expect(match?.materials).toEqual([
            { name: 'Madeira nobre', amount: 3 },
            { name: 'Ferro', amount: 15 },
            { name: 'Eitr refinado', amount: 10 },
            { name: 'Fogo-fátuo', amount: 3 }
        ]);

        if (!match) {
            throw new Error('The weapon search did not return Mistwalker.');
        }
        component.addFromCatalog(match);
        await harness.fixture.whenStable();

        const addedWeapon = listStore.findById(list.id)?.constructionItems[0];
        expect(addedWeapon?.kind).toBe('weapon');
        expect(addedWeapon?.nameEn).toBe('Mistwalker');
        expect(addedWeapon?.materials).toEqual(match.materials);
    });

    it('searches and adds building data in Portuguese and English', async () => {
        const listStore = TestBed.inject(ConstructionListStore);
        const list = await listStore.addList({
            title: 'Construções',
            region: 'Terras de Cinzas',
            description: '',
            imageId: valheimImages[0].id
        });
        if (!list) {
            throw new Error('The API did not create the test list.');
        }
        const harness = await RouterTestingHarness.create();
        const component = await harness.navigateByUrl(`/view-list/${list.id}`, ViewList);

        component.search.set('estruturas de mármore negro');
        const portugueseMatch = component
            .matchingCatalog()
            .find((entry) => entry.id === 'building_black_marble_structures');
        expect(portugueseMatch?.kind).toBe('building');

        component.search.set('black marble structures');
        const englishMatch = component
            .matchingCatalog()
            .find((entry) => entry.id === 'building_black_marble_structures');
        expect(englishMatch?.name).toBe('Estruturas de mármore negro');

        if (!englishMatch) {
            throw new Error('The building search did not return Black Marble Structures.');
        }
        component.addFromCatalog(englishMatch);
        await harness.fixture.whenStable();

        const addedBuilding = listStore.findById(list.id)?.constructionItems[0];
        expect(addedBuilding?.kind).toBe('building');
        expect(addedBuilding?.unitDescription).toContain('Categoria:');
        expect(addedBuilding?.materials).toHaveLength(0);
    });
});
