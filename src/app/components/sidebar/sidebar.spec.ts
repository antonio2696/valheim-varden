import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTestApi } from '../../../testing/in-memory-api';
import { Sidebar, SidebarItem } from './sidebar';

describe('Sidebar', () => {
    it('shows five lists per section and expands the lists on request', async () => {
        await TestBed.configureTestingModule({
            imports: [Sidebar],
            providers: [...provideTestApi(), provideRouter([])]
        }).compileComponents();

        const fixture = TestBed.createComponent(Sidebar);
        const lists: SidebarItem[] = Array.from({ length: 6 }, (_, index) => ({
            id: `list-${index}`,
            label: `Lista ${index + 1}`
        }));
        fixture.componentRef.setInput('privateLists', lists);
        fixture.componentRef.setInput('sharedLists', lists);
        fixture.detectChanges();

        const sections = fixture.nativeElement.querySelectorAll(
            'nav section'
        ) as NodeListOf<HTMLElement>;
        expect(sections[0].querySelectorAll('li a')).toHaveLength(5);
        expect(sections[1].querySelectorAll('li a')).toHaveLength(5);
        expect(fixture.nativeElement.querySelectorAll('nav li a span.rounded')).toHaveLength(0);
        expect(fixture.nativeElement.querySelector('nav').classList).toContain('overflow-y-auto');

        const moreButtons = [...fixture.nativeElement.querySelectorAll('nav button')].filter(
            (button: HTMLButtonElement) => button.textContent.trim() === 'Ver mais'
        ) as HTMLButtonElement[];
        expect(moreButtons).toHaveLength(2);
        moreButtons[0].click();
        moreButtons[1].click();
        fixture.detectChanges();

        expect(sections[0].querySelectorAll('li a')).toHaveLength(6);
        expect(sections[1].querySelectorAll('li a')).toHaveLength(6);
        expect(fixture.nativeElement.textContent).toContain(
            'Planeje em terra firme. Construa além do horizonte.'
        );
    });
});
