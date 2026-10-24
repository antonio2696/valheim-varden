import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ConstructionListStore } from '../home/construction-list.store';
import { routes } from '../../app.routes';
import { valheimImages } from '../../data/valheim-images';
import { CreateList } from './create-list';
import { provideTestApi } from '../../../testing/in-memory-api';

describe('CreateList', () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => vi.restoreAllMocks());

    it('starts with a randomly selected cover and opens all gallery options on request', async () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.14);
        await TestBed.configureTestingModule({
            imports: [CreateList],
            providers: [...provideTestApi(), provideRouter(routes)]
        }).compileComponents();

        const fixture = TestBed.createComponent(CreateList);
        fixture.detectChanges();

        expect(fixture.componentInstance.form.controls.imageId.value).toBe(valheimImages[7].id);
        expect(fixture.nativeElement.querySelector('input[type="radio"]')).toBeNull();

        const changeCoverButton = [...fixture.nativeElement.querySelectorAll('button')].find(
            (button: HTMLButtonElement) => button.textContent.trim() === 'Alterar capa'
        ) as HTMLButtonElement | undefined;
        changeCoverButton?.click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('input[type="radio"]')).toHaveLength(
            valheimImages.length
        );
        expect(valheimImages).toHaveLength(51);
    });

    it('updates the selected cover and closes the image options after selection', async () => {
        await TestBed.configureTestingModule({
            imports: [CreateList],
            providers: [...provideTestApi(), provideRouter(routes)]
        }).compileComponents();

        const fixture = TestBed.createComponent(CreateList);
        fixture.detectChanges();
        fixture.componentInstance.imagePickerOpen.set(true);
        fixture.detectChanges();

        const selectedOption = fixture.nativeElement.querySelectorAll(
            'input[type="radio"]'
        )[7] as HTMLInputElement;
        selectedOption.checked = true;
        selectedOption.dispatchEvent(new Event('change'));
        fixture.detectChanges();

        expect(fixture.componentInstance.form.controls.imageId.value).toBe(valheimImages[7].id);
        expect(fixture.componentInstance.selectedImage().id).toBe(valheimImages[7].id);
        expect(fixture.componentInstance.imagePickerOpen()).toBe(false);
        expect(fixture.nativeElement.querySelector('input[type="radio"]')).toBeNull();
    });

    it('creates a list with a UUID and opens its detail route', async () => {
        await TestBed.configureTestingModule({
            imports: [CreateList],
            providers: [...provideTestApi(), provideRouter(routes)]
        }).compileComponents();

        const fixture = TestBed.createComponent(CreateList);
        const component = fixture.componentInstance;
        component.form.setValue({
            title: 'Salão de teste',
            region: 'Montanhas',
            description: 'Uma construção para testar.',
            isShared: false,
            imageId: valheimImages[7].id
        });

        await component.createList();
        await fixture.whenStable();

        const createdList = TestBed.inject(ConstructionListStore).lists()[0];
        expect(createdList).toBeDefined();
        expect(createdList.title).toBe('Salão de teste');
        expect(createdList.region).toBe('Montanhas');
        expect(createdList.imageUrl).toBe(valheimImages[7].url);
        expect(createdList.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
        expect(TestBed.inject(Router).url).toBe(`/view-list/${createdList.id}`);
    });

    it('does not create a list with invalid required fields', async () => {
        await TestBed.configureTestingModule({
            imports: [CreateList],
            providers: [...provideTestApi(), provideRouter(routes)]
        }).compileComponents();

        const fixture = TestBed.createComponent(CreateList);
        await fixture.componentInstance.createList();

        expect(TestBed.inject(ConstructionListStore).lists()).toHaveLength(0);
        expect(fixture.componentInstance.form.controls.title.touched).toBe(true);
    });

    it('allows a new list to be created as shared', async () => {
        await TestBed.configureTestingModule({
            imports: [CreateList],
            providers: [...provideTestApi(), provideRouter(routes)]
        }).compileComponents();

        const component = TestBed.createComponent(CreateList).componentInstance;
        component.form.setValue({
            title: 'Salão compartilhado',
            region: 'Montanhas',
            description: '',
            isShared: true,
            imageId: valheimImages[0].id
        });

        await component.createList();

        expect(TestBed.inject(ConstructionListStore).lists()[0]?.isShared).toBe(true);
    });

    it('includes the latest released biomes', async () => {
        await TestBed.configureTestingModule({
            imports: [CreateList],
            providers: [...provideTestApi(), provideRouter(routes)]
        }).compileComponents();

        const fixture = TestBed.createComponent(CreateList);
        fixture.detectChanges();

        const options = [...fixture.nativeElement.querySelectorAll('#list-region option')].map(
            (option: HTMLOptionElement) => option.textContent.trim()
        );
        expect(options).toContain('Terras Nevoentas');
        expect(options).toContain('Terras Cinzentas');
        expect(options).toContain('Norte Profundo');
    });
});
