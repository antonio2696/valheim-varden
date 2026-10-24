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

describe('ViewList route', () => {
    beforeEach(async () => {
        localStorage.clear();
        await TestBed.configureTestingModule({
            providers: [provideRouter(routes)]
        }).compileComponents();
    });

    it('opens the list details from the home card', async () => {
        const list = TestBed.inject(ConstructionListStore).addList({
            title: 'Refúgio de teste',
            region: 'Pradarias',
            description: 'Lista de teste',
            imageId: valheimImages[0].id
        });
        const harness = await RouterTestingHarness.create();
        await harness.navigateByUrl('/home', Home);
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
        const list = listStore.addList({
            title: 'Refúgio de teste',
            region: 'Pradarias',
            description: 'Lista de teste',
            imageId: valheimImages[0].id
        });
        listStore.addConstruction(list.id, constructionCatalog[0]);
        const harness = await RouterTestingHarness.create();
        const component = await harness.navigateByUrl(`/view-list/${list.id}`, ViewList);

        expect(component.list()?.title).toBe(list.title);
        expect(harness.routeNativeElement?.textContent).toContain('Bancada de trabalho');
    });

    it('searches the local database in Portuguese and English and adds recipe data', async () => {
        const listStore = TestBed.inject(ConstructionListStore);
        const list = listStore.addList({
            title: 'Receitas',
            region: 'Pradarias',
            description: '',
            imageId: valheimImages[0].id
        });
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

        const addedItem = listStore.findById(list.id)?.constructionItems[0];
        expect(addedItem?.materials.length).toBeGreaterThan(0);
        expect(addedItem?.unitDescription).toContain('Estação:');
        expect(component.search()).toBe('');
    });

    it('adds autocomplete results with Enter without delaying local search', async () => {
        const listStore = TestBed.inject(ConstructionListStore);
        const list = listStore.addList({
            title: 'Armaduras',
            region: 'Montanhas',
            description: '',
            imageId: valheimImages[0].id
        });
        const harness = await RouterTestingHarness.create();
        const component = await harness.navigateByUrl(`/view-list/${list.id}`, ViewList);
        component.search.set('capa de odin');

        expect(
            component.matchingCatalog().some((entry) => entry.id === 'armor_cape_of_odin_dlc')
        ).toBe(true);
        const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
        component.handleSearchKeydown(enter);

        const addedArmor = listStore.findById(list.id)?.constructionItems[0];
        expect(enter.defaultPrevented).toBe(true);
        expect(addedArmor?.name).toBe('Capa de Odin');
        expect(addedArmor?.unitDescription).toContain('Armadura:');
    });

    it('searches and adds weapon data from the bilingual weapons catalog', async () => {
        const listStore = TestBed.inject(ConstructionListStore);
        const list = listStore.addList({
            title: 'Armas',
            region: 'Pradarias',
            description: '',
            imageId: valheimImages[0].id
        });
        const harness = await RouterTestingHarness.create();
        const component = await harness.navigateByUrl(`/view-list/${list.id}`, ViewList);
        component.search.set('mistwalker');

        const match = component.matchingCatalog().find((entry) => entry.id === 'weapon_mistwalker');
        expect(match?.name).toBe('Andarilho da névoa');
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

        const addedWeapon = listStore.findById(list.id)?.constructionItems[0];
        expect(addedWeapon?.kind).toBe('weapon');
        expect(addedWeapon?.nameEn).toBe('Mistwalker');
        expect(addedWeapon?.materials).toEqual(match.materials);
    });

    it('searches and adds building data in Portuguese and English', async () => {
        const listStore = TestBed.inject(ConstructionListStore);
        const list = listStore.addList({
            title: 'Construções',
            region: 'Terras de Cinzas',
            description: '',
            imageId: valheimImages[0].id
        });
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

        const addedBuilding = listStore.findById(list.id)?.constructionItems[0];
        expect(addedBuilding?.kind).toBe('building');
        expect(addedBuilding?.unitDescription).toContain('Categoria:');
        expect(addedBuilding?.materials).toHaveLength(0);
    });
});
