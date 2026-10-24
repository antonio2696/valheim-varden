import { TestBed } from '@angular/core/testing';
import { valheimImages } from '../../data/valheim-images';
import { ConstructionListStore } from '../../pages/home/construction-list.store';
import { RenameListAction } from './rename-list-action';
import { provideTestApi } from '../../../testing/in-memory-api';
import { AuthStore } from '../../auth/auth.store';

describe('RenameListAction', () => {
    beforeEach(() => localStorage.clear());

    it('renames a list and persists the updated title', async () => {
        await TestBed.configureTestingModule({
            imports: [RenameListAction],
            providers: provideTestApi()
        }).compileComponents();

        const store = TestBed.inject(ConstructionListStore);
        TestBed.inject(AuthStore).user.set({
            id: 1,
            username: 'viking',
            email: 'viking@example.com',
            admin: false
        });
        const list = await store.addList({
            title: 'Nome antigo',
            region: 'Pradarias',
            description: '',
            imageId: valheimImages[0].id
        });
        if (!list) {
            throw new Error('The API did not create the test list.');
        }
        const fixture = TestBed.createComponent(RenameListAction);
        fixture.componentRef.setInput('listId', list.id);
        fixture.componentRef.setInput('title', list.title);
        fixture.detectChanges();

        fixture.nativeElement.querySelector('button').click();
        fixture.detectChanges();

        const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
        input.value = 'Nome atualizado';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        fixture.nativeElement.querySelector('button[type="submit"]').click();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(store.findById(list.id)?.title).toBe('Nome atualizado');
        expect(fixture.nativeElement.textContent).toContain('Renomear');
    });
});
