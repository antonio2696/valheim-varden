import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
import { Home } from './home';
import { routes } from '../../app.routes';
import { ConstructionListStore } from './construction-list.store';
import { valheimImages } from '../../data/valheim-images';

describe('Home', () => {
    beforeEach(() => localStorage.clear());

    it('links to the view-list screen when opening a list', async () => {
        await TestBed.configureTestingModule({
            imports: [Home],
            providers: [provideRouter(routes)]
        }).compileComponents();

        const list = TestBed.inject(ConstructionListStore).addList({
            title: 'Refúgio de teste',
            region: 'Pradarias',
            description: 'Lista de teste',
            imageId: valheimImages[0].id
        });
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
});
