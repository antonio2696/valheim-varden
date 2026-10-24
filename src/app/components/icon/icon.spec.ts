import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { VardenIcon, VardenIconName, vardenIconNames } from './icon';

@Component({
    template: '<svg [vardenIcon]="icon()" [size]="16"></svg>',
    imports: [VardenIcon]
})
class IconHost {
    readonly icon = signal<VardenIconName>('arrowRight');
}

describe('VardenIcon', () => {
    it('renders every registered icon as an accessible SVG', async () => {
        await TestBed.configureTestingModule({ imports: [IconHost] }).compileComponents();

        const fixture = TestBed.createComponent(IconHost);
        const host = fixture.componentInstance;
        const svg = fixture.nativeElement.querySelector('svg') as SVGSVGElement;

        for (const name of vardenIconNames) {
            host.icon.set(name);
            fixture.detectChanges();

            expect(svg.children.length).toBeGreaterThan(0);
            expect(svg.getAttribute('width')).toBe('16');
            expect(svg.getAttribute('aria-hidden')).toBe('true');
        }
    });
});
