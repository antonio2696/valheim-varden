import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../../auth/auth.store';

@Component({
    selector: 'varden-login',
    templateUrl: './login.html',
    imports: [ReactiveFormsModule]
})
export class Login {
    private readonly formBuilder = inject(NonNullableFormBuilder);
    private readonly auth = inject(AuthStore);
    private readonly router = inject(Router);
    readonly error = this.auth.error;
    readonly registering = signal(false);
    readonly submitting = signal(false);
    readonly form = this.formBuilder.group({
        username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(32)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
        password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]]
    });

    async submit(): Promise<void> {
        if (
            this.form.controls.username.invalid ||
            this.form.controls.password.invalid ||
            (this.registering() && this.form.controls.email.invalid)
        ) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting.set(true);
        const { username, email, password } = this.form.getRawValue();
        const authenticated = this.registering()
            ? await this.auth.register(username, email, password)
            : await this.auth.login(username, password);
        this.submitting.set(false);

        if (authenticated) {
            await this.router.navigate(['/my-lists']);
        }
    }

    toggleMode(): void {
        this.registering.update((registering) => !registering);
        this.form.controls.email.setValidators(
            this.registering()
                ? [Validators.required, Validators.email, Validators.maxLength(254)]
                : []
        );
        this.form.controls.email.updateValueAndValidity();
        this.auth.clearError();
    }
}
