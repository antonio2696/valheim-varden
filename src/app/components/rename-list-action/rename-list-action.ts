import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { VardenIcon } from '../icon/icon';
import { ConstructionListStore } from '../../pages/home/construction-list.store';

@Component({
    selector: 'varden-rename-list-action',
    templateUrl: './rename-list-action.html',
    imports: [ReactiveFormsModule, VardenIcon]
})
export class RenameListAction {
    readonly listId = input.required<string>();
    readonly title = input.required<string>();
    private readonly formBuilder = inject(NonNullableFormBuilder);
    private readonly listStore = inject(ConstructionListStore);
    readonly editIcon = 'pencil';
    readonly editing = signal(false);
    readonly form = this.formBuilder.group({
        title: ['', [Validators.required, Validators.maxLength(100)]]
    });

    startEditing(): void {
        this.form.controls.title.setValue(this.title());
        this.form.controls.title.markAsUntouched();
        this.editing.set(true);
    }

    cancelEditing(): void {
        this.editing.set(false);
    }

    save(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        if (this.listStore.renameList(this.listId(), this.form.controls.title.value)) {
            this.editing.set(false);
        }
    }
}
