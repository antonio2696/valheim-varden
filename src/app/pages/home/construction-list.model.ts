export type ListFilter = 'all' | 'planning' | 'completed';

export interface ConstructionList {
    id: string;
    title: string;
    region: string;
    description: string;
    completedUnits: number;
    totalUnits: number;
    buildings: number;
    progress: number;
    updatedAt: string;
    imageUrl: string;
    imageThumbnailUrl?: string;
    imageAlt: string;
    priority: boolean;
    status: Exclude<ListFilter, 'all'>;
    updatedOrder: number;
    constructionItems: ConstructionItem[];
    ownerUserId: number;
    isShared: boolean;
    allowEditing: boolean;
    decomposeMaterials?: boolean;
}

export interface ConstructionMaterial {
    name: string;
    amount: number;
}

export type ConstructionKind = 'construction' | 'building' | 'recipe' | 'mead' | 'armor' | 'weapon';

export interface ConstructionItem {
    id: string;
    name: string;
    nameEn?: string;
    aliases?: string[];
    kind?: ConstructionKind;
    icon: 'workbench' | 'bed' | 'chest' | 'campfire' | 'portal' | 'sword';
    unitDescription: string;
    quantity: number;
    completed: boolean;
    materials: ConstructionMaterial[];
    outputQuantity?: number;
}

export function formatListUpdatedAt(updatedAt: string): string {
    const timestamp = Date.parse(updatedAt);
    if (Number.isNaN(timestamp)) {
        return updatedAt;
    }

    const elapsedMilliseconds = Math.max(0, Date.now() - timestamp);
    const elapsedMinutes = Math.floor(elapsedMilliseconds / 60_000);

    if (elapsedMinutes < 1) {
        return 'Atualizada agora';
    }
    if (elapsedMinutes < 60) {
        return `Atualizada há ${elapsedMinutes} min`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) {
        return `Atualizada há ${elapsedHours} h`;
    }

    const elapsedDays = Math.floor(elapsedHours / 24);
    if (elapsedDays < 7) {
        return `Atualizada há ${elapsedDays} dia${elapsedDays === 1 ? '' : 's'}`;
    }

    return `Atualizada em ${new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short'
    }).format(timestamp)}`;
}
