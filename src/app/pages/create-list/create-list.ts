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
    readonly listStoreError = this.listStore.error;
    readonly submitting = signal(false);
    readonly imagePickerOpen = signal(false);
    readonly form = this.formBuilder.group({
        title: ['', [Validators.required, Validators.maxLength(100)]],
        region: ['', Validators.required],
        description: [''],
        isShared: [false],
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

    async createList(): Promise<void> {
        if (this.form.invalid || this.submitting()) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting.set(true);
        try {
            const list = await this.listStore.addList(this.form.getRawValue());
            if (list) {
                await this.router.navigate(['/view-list', list.id]);
            }
        } finally {
            this.submitting.set(false);
        }
    }
}
