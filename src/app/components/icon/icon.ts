import {
    Directive,
    ElementRef,
    Renderer2,
    effect,
    inject,
    input,
    numberAttribute
} from '@angular/core';

type SvgNode = readonly [
    tag: 'circle' | 'path' | 'rect',
    attributes: Readonly<Record<string, string>>
];

export const vardenIconNames = [
    'arrowLeft',
    'arrowRight',
    'arrowUpDown',
    'bedDouble',
    'check',
    'circleCheck',
    'circleDashed',
    'clipboardList',
    'compass',
    'externalLink',
    'flame',
    'hammer',
    'layers',
    'lightbulb',
    'minus',
    'orbit',
    'package2',
    'pencil',
    'pickaxe',
    'plus',
    'search',
    'sword',
    'trash2'
] as const;

export type VardenIconName = (typeof vardenIconNames)[number];

const iconNodes = {
    arrowLeft: [
        ['path', { d: 'm12 19-7-7 7-7' }],
        ['path', { d: 'M19 12H5' }]
    ],
    arrowRight: [
        ['path', { d: 'M5 12h14' }],
        ['path', { d: 'm12 5 7 7-7 7' }]
    ],
    arrowUpDown: [
        ['path', { d: 'm21 16-4 4-4-4' }],
        ['path', { d: 'M17 20V4' }],
        ['path', { d: 'm3 8 4-4 4 4' }],
        ['path', { d: 'M7 4v16' }]
    ],
    bedDouble: [
        ['path', { d: 'M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8' }],
        ['path', { d: 'M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4' }],
        ['path', { d: 'M12 4v6' }],
        ['path', { d: 'M2 18h20' }]
    ],
    check: [['path', { d: 'M20 6 9 17l-5-5' }]],
    circleCheck: [
        ['circle', { cx: '12', cy: '12', r: '10' }],
        ['path', { d: 'm16 9-5.5 5.5L8 12' }]
    ],
    circleDashed: [
        ['path', { d: 'M10.1 2.182a10 10 0 0 1 3.8 0' }],
        ['path', { d: 'M13.9 21.818a10 10 0 0 1-3.8 0' }],
        ['path', { d: 'M17.609 3.721a10 10 0 0 1 2.69 2.7' }],
        ['path', { d: 'M2.182 13.9a10 10 0 0 1 0-3.8' }],
        ['path', { d: 'M20.279 17.609a10 10 0 0 1-2.7 2.69' }],
        ['path', { d: 'M21.818 10.1a10 10 0 0 1 0 3.8' }],
        ['path', { d: 'M3.721 6.391a10 10 0 0 1 2.7-2.69' }],
        ['path', { d: 'M6.391 20.279a10 10 0 0 1-2.69-2.7' }]
    ],
    clipboardList: [
        ['rect', { width: '8', height: '4', x: '8', y: '2', rx: '1', ry: '1' }],
        ['path', { d: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2' }],
        ['path', { d: 'M12 11h4' }],
        ['path', { d: 'M12 16h4' }],
        ['path', { d: 'M8 11h.01' }],
        ['path', { d: 'M8 16h.01' }]
    ],
    compass: [
        ['circle', { cx: '12', cy: '12', r: '10' }],
        [
            'path',
            {
                d: 'm16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z'
            }
        ]
    ],
    externalLink: [
        ['path', { d: 'M15 3h6v6' }],
        ['path', { d: 'M10 14 21 3' }],
        ['path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }]
    ],
    flame: [
        [
            'path',
            {
                d: 'M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4'
            }
        ]
    ],
    hammer: [
        ['path', { d: 'm15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9' }],
        ['path', { d: 'm18 15 4-4' }],
        [
            'path',
            {
                d: 'm21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5'
            }
        ]
    ],
    layers: [
        [
            'path',
            {
                d: 'M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z'
            }
        ],
        [
            'path',
            { d: 'M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12' }
        ],
        ['path', { d: 'M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17' }]
    ],
    lightbulb: [
        [
            'path',
            {
                d: 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5'
            }
        ],
        ['path', { d: 'M9 18h6' }],
        ['path', { d: 'M10 22h4' }]
    ],
    minus: [['path', { d: 'M5 12h14' }]],
    orbit: [
        ['path', { d: 'M20.341 6.484A10 10 0 0 1 10.266 21.85' }],
        ['path', { d: 'M3.659 17.516A10 10 0 0 1 13.74 2.152' }],
        ['circle', { cx: '12', cy: '12', r: '3' }],
        ['circle', { cx: '19', cy: '5', r: '2' }],
        ['circle', { cx: '5', cy: '19', r: '2' }]
    ],
    package2: [
        ['path', { d: 'M12 3v6' }],
        [
            'path',
            {
                d: 'M16.76 3a2 2 0 0 1 1.8 1.1l2.23 4.479a2 2 0 0 1 .21.891V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.472a2 2 0 0 1 .211-.894L5.45 4.1A2 2 0 0 1 7.24 3z'
            }
        ],
        ['path', { d: 'M3.054 9.013h17.893' }]
    ],
    pencil: [
        [
            'path',
            {
                d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z'
            }
        ],
        ['path', { d: 'm15 5 4 4' }]
    ],
    pickaxe: [
        ['path', { d: 'm14 13-8.381 8.38a1 1 0 0 1-3.001-3L11 9.999' }],
        [
            'path',
            {
                d: 'M15.973 4.027A13 13 0 0 0 5.902 2.373c-1.398.342-1.092 2.158.277 2.601a19.9 19.9 0 0 1 5.822 3.024'
            }
        ],
        [
            'path',
            {
                d: 'M16.001 11.999a19.9 19.9 0 0 1 3.024 5.824c.444 1.369 2.26 1.676 2.603.278A13 13 0 0 0 20 8.069'
            }
        ],
        [
            'path',
            {
                d: 'M18.352 3.352a1.205 1.205 0 0 0-1.704 0l-5.296 5.296a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l5.296-5.296a1.205 1.205 0 0 0 0-1.704z'
            }
        ]
    ],
    plus: [
        ['path', { d: 'M5 12h14' }],
        ['path', { d: 'M12 5v14' }]
    ],
    search: [
        ['path', { d: 'm21 21-4.34-4.34' }],
        ['circle', { cx: '11', cy: '11', r: '8' }]
    ],
    sword: [
        ['path', { d: 'm11 19-6-6' }],
        ['path', { d: 'm5 21-2-2' }],
        ['path', { d: 'm8 16-4 4' }],
        [
            'path',
            { d: 'M9.5 17.5 20.414 6.586A2 2 0 0 0 21 5.172V3h-2.172a2 2 0 0 0-1.414.586L6.5 14.5' }
        ]
    ],
    trash2: [
        ['path', { d: 'M10 11v6' }],
        ['path', { d: 'M14 11v6' }],
        ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' }],
        ['path', { d: 'M3 6h18' }],
        ['path', { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }]
    ]
} as const satisfies Record<VardenIconName, readonly SvgNode[]>;

@Directive({
    selector: 'svg[vardenIcon]',
    host: {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        focusable: 'false',
        'aria-hidden': 'true',
        '[attr.width]': 'size()',
        '[attr.height]': 'size()'
    }
})
export class VardenIcon {
    readonly name = input.required<VardenIconName>({ alias: 'vardenIcon' });
    readonly size = input(24, { transform: numberAttribute });
    private readonly element = inject(ElementRef<SVGSVGElement>);
    private readonly renderer = inject(Renderer2);

    constructor() {
        effect(() => this.render(this.name()));
    }

    private render(name: VardenIconName): void {
        const svg = this.element.nativeElement;
        while (svg.firstChild) {
            this.renderer.removeChild(svg, svg.firstChild);
        }

        for (const [tag, attributes] of iconNodes[name]) {
            const child = this.renderer.createElement(tag, 'svg') as SVGElement;
            for (const [attribute, value] of Object.entries(attributes)) {
                this.renderer.setAttribute(child, attribute, value);
            }
            this.renderer.appendChild(svg, child);
        }
    }
}
