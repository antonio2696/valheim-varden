import { TestBed } from '@angular/core/testing';
import { valheimImages } from '../../data/valheim-images';
import { ConstructionListStore } from '../../pages/home/construction-list.store';
import { RenameListAction } from './rename-list-action';

describe('RenameListAction', () => {
    beforeEach(() => localStorage.clear());

    it('renames a list and persists the updated title', async () => {
        await TestBed.configureTestingModule({
            imports: [RenameListAction]
        }).compileComponents();

        const store = TestBed.inject(ConstructionListStore);
        const list = store.addList({
            title: 'Nome antigo',
            region: 'Pradarias',
            description: '',
            imageId: valheimImages[0].id
        });
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
        fixture.detectChanges();

        expect(store.findById(list.id)?.title).toBe('Nome atualizado');
        expect(
            JSON.parse(localStorage.getItem('varden.construction-lists.v1') ?? '{}').lists[0].title
        ).toBe('Nome atualizado');
        expect(fixture.nativeElement.textContent).toContain('Renomear');
    });
});
