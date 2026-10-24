import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
import { Home } from './home';
import { routes } from '../../app.routes';
import { ConstructionListStore } from './construction-list.store';
import { valheimImages } from '../../data/valheim-images';
import { AuthStore } from '../../auth/auth.store';
import { provideTestApi } from '../../../testing/in-memory-api';

describe('Home', () => {
    beforeEach(() => localStorage.clear());

    it('links to the view-list screen when opening a list', async () => {
        await TestBed.configureTestingModule({
            imports: [Home],
            providers: [...provideTestApi(), provideRouter(routes)]
        }).compileComponents();

        TestBed.inject(AuthStore).user.set({
            id: 1,
            username: 'viking',
            email: 'viking@example.com',
            admin: false
        });
        const list = await TestBed.inject(ConstructionListStore).addList({
            title: 'Refúgio de teste',
            region: 'Pradarias',
            description: 'Lista de teste',
            imageId: valheimImages[0].id
        });
        if (!list) {
            throw new Error('The API did not create the test list.');
        }
        const fixture = TestBed.createComponent(Home);
        fixture.detectChanges();
        const cardImage = fixture.nativeElement.querySelector(
            'section[aria-label="Listas de construções"] article img'
        ) as HTMLImageElement;
        const openButton = fixture.debugElement
            .queryAll(By.directive(RouterLink))
            .find((element) =>
                element.injector.get(RouterLink).urlTree?.toString().startsWith('/view-list/')
            );

        expect(openButton?.injector.get(RouterLink).urlTree?.toString()).toBe(
            `/view-list/${list.id}`
        );
        expect(cardImage.getAttribute('src')).toBe(valheimImages[0].thumbnailUrl);
        expect(cardImage.getAttribute('fetchpriority')).toBe('high');
    });

    it('asks for confirmation before deleting a list', async () => {
        await TestBed.configureTestingModule({
            imports: [Home],
            providers: [...provideTestApi(), provideRouter(routes)]
        }).compileComponents();

        const store = TestBed.inject(ConstructionListStore);
        TestBed.inject(AuthStore).user.set({
            id: 1,
            username: 'viking',
            email: 'viking@example.com',
            admin: false
        });
        const list = await store.addList({
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
        const fixture = TestBed.createComponent(Home);
        fixture.detectChanges();
        const deleteButton = fixture.nativeElement.querySelector(
            'button[aria-label="Excluir lista Refúgio de teste"]'
        ) as HTMLButtonElement;

        deleteButton.click();
        expect(store.findById(list.id)).toBeDefined();
        expect(confirm).toHaveBeenCalledWith(
            'Excluir a lista "Refúgio de teste"? Esta ação não pode ser desfeita.'
        );

        await fixture.componentInstance.deleteList(list.id, list.title);
        fixture.detectChanges();

        expect(store.findById(list.id)).toBeUndefined();
        expect(
            fixture.nativeElement.querySelector(
                'button[aria-label="Excluir lista Refúgio de teste"]'
            )
        ).toBeNull();
    });
});
