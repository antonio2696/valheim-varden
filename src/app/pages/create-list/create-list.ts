import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Button } from '../../components/button/button';
import { VardenIcon } from '../../components/icon/icon';
import { valheimImages } from '../../data/valheim-images';
import { ConstructionListStore } from '../home/construction-list.store';

@Component({
    selector: 'varden-create-list',
    templateUrl: './create-list.html',
    imports: [Button, ReactiveFormsModule, RouterLink, VardenIcon]
})
export class CreateList {
    private readonly formBuilder = inject(NonNullableFormBuilder);
    private readonly router = inject(Router);
    private readonly listStore = inject(ConstructionListStore);
    readonly backIcon = 'arrowLeft';
    readonly plusIcon = 'plus';
    readonly images = valheimImages;
    readonly imagePickerOpen = signal(false);
    readonly form = this.formBuilder.group({
        title: ['', [Validators.required, Validators.maxLength(100)]],
        region: ['', Validators.required],
        description: [''],
        imageId: [
            valheimImages[Math.floor(Math.random() * valheimImages.length)].id,
            Validators.required
        ]
    });
    private readonly selectedImageId = toSignal(this.form.controls.imageId.valueChanges, {
        initialValue: this.form.controls.imageId.value
    });
    readonly selectedImage = computed(
        () => this.images.find((image) => image.id === this.selectedImageId()) ?? this.images[0]
    );

    closeImagePicker(): void {
        this.imagePickerOpen.set(false);
    }

    createList(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const list = this.listStore.addList(this.form.getRawValue());
        void this.router.navigate(['/view-list', list.id]);
    }
}
