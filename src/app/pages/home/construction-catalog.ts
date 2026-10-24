import { ConstructionItem } from './construction-list.model';
import { valheimDatabaseItems } from '../../data/item-database';

const constructionEntries: Omit<ConstructionItem, 'quantity' | 'completed'>[] = [
    {
        id: 'workbench',
        name: 'Bancada de trabalho',
        nameEn: 'Workbench',
        kind: 'construction',
        icon: 'workbench',
        unitDescription: '10 Madeira',
        materials: [{ name: 'Madeira', amount: 10 }]
    },
    {
        id: 'bed',
        name: 'Cama',
        nameEn: 'Bed',
        kind: 'construction',
        icon: 'bed',
        unitDescription: '8 Madeira',
        materials: [{ name: 'Madeira', amount: 8 }]
    },
    {
        id: 'chest',
        name: 'Baú',
        nameEn: 'Chest',
        kind: 'construction',
        icon: 'chest',
        unitDescription: '10 Madeira',
        materials: [{ name: 'Madeira', amount: 10 }]
    },
    {
        id: 'campfire',
        name: 'Fogueira',
        nameEn: 'Campfire',
        kind: 'construction',
        icon: 'campfire',
        unitDescription: '2 Madeira · 5 Pedra',
        materials: [
            { name: 'Madeira', amount: 2 },
            { name: 'Pedra', amount: 5 }
        ]
    },
    {
        id: 'portal',
        name: 'Portal',
        nameEn: 'Portal',
        kind: 'construction',
        icon: 'portal',
        unitDescription: '20 Madeira fina · 10 Olho de anão-cinzento · 2 Núcleo de Surtling',
        materials: [
            { name: 'Madeira fina', amount: 20 },
            { name: 'Olho de anão-cinzento', amount: 10 },
            { name: 'Núcleo de Surtling', amount: 2 }
        ]
    }
];

export const constructionCatalog = [...constructionEntries, ...valheimDatabaseItems];
