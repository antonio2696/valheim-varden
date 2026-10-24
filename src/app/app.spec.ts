import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { provideTestApi } from '../testing/in-memory-api';
import { ConstructionListStore } from './pages/home/construction-list.store';

describe('App', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [App],
            providers: [...provideTestApi(), provideRouter(routes)]
        }).compileComponents();
    });

    it('should create the app', () => {
        const fixture = TestBed.createComponent(App);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });

    it('should render the router outlet', async () => {
        const fixture = TestBed.createComponent(App);
        await fixture.whenStable();
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('router-outlet')).toBeTruthy();
    });

    it('announces pending API requests with an accessible loading indicator', () => {
        const fixture = TestBed.createComponent(App);
        const listStore = TestBed.inject(ConstructionListStore);
        listStore.isLoading.set(true);
        fixture.detectChanges();

        const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
        expect(status.textContent).toContain('Processando...');
        expect(status.getAttribute('aria-live')).toBe('polite');

        listStore.isLoading.set(false);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
    });
});
