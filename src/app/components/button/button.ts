import { Component, input } from '@angular/core';
import { VardenIcon, VardenIconName } from '../icon/icon';

@Component({
    selector: 'button[varden-button]',
    templateUrl: './button.html',
    host: {
        class: `flex items-center gap-2 rounded-sm px-4 py-3
            cursor-pointer font-semibold text-base
            bg-[#D6AB62] border border-[#D6AB62]
            transition-all duration-300 ease-in
            hover:!bg-[#E8BF79] hover:border-[#F2D49C]
            `,
        style: 'background-color: #D6AB62'
    },
    imports: [VardenIcon]
})
export class Button {
    readonly icon = input<VardenIconName | null>(null);
}
