import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthStore } from '../../auth/auth.store';
import { routes } from '../../app.routes';
import { provideTestApi } from '../../../testing/in-memory-api';
import { Login } from './login';

describe('Login', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Login],
            providers: [...provideTestApi(), provideRouter(routes)]
        }).compileComponents();
    });

    it('logs in and navigates to the private lists', async () => {
        const fixture = TestBed.createComponent(Login);
        const component = fixture.componentInstance;
        component.form.controls.username.setValue('viking');
        component.form.controls.password.setValue('secret-password');

        await component.submit();

        expect(TestBed.inject(AuthStore).user()?.username).toBe('viking');
        expect(TestBed.inject(Router).url).toBe('/my-lists');
    });

    it('requires an email when switching to account registration', async () => {
        const fixture = TestBed.createComponent(Login);
        const component = fixture.componentInstance;
        component.toggleMode();
        component.form.controls.username.setValue('new-viking');
        component.form.controls.password.setValue('secret-password');

        await component.submit();

        expect(component.form.controls.email.invalid).toBe(true);
        expect(TestBed.inject(AuthStore).user()).toBeNull();
        expect(TestBed.inject(Router).url).toBe('/');
    });
});
