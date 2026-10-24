import armorData from './items/valheim_armaduras_bilingue.json';
import meadData from './items/valheim_meads_bilingue.json';
import recipeData from './items/valheim_receitas_bilingue.json';
import weaponData from './items/valheim_armas_bilingue.json';
import weaponMaterialData from './items/valheim_armas_materiais_bilingue.json';
import buildingData from './items/valheim_construcoes_bilingue.json';
import { ConstructionItem, ConstructionMaterial } from '../pages/home/construction-list.model';

type CatalogEntry = Omit<ConstructionItem, 'quantity' | 'completed'>;

const recipes: CatalogEntry[] = recipeData.map((recipe) => ({
    id: `recipe_${recipe.id}`,
    name: recipe.name['pt-BR'],
    nameEn: recipe.name.en,
    aliases: [...recipe.aliases['pt-BR'], ...recipe.aliases.en],
    kind: 'recipe',
    icon: 'campfire',
    outputQuantity:
        recipe.craftingMultiplierUnit === 'items' ? recipe.craftingMultiplier : undefined,
    unitDescription: [
        recipe.craftingStation?.name['pt-BR']
            ? `Estação: ${recipe.craftingStation.name['pt-BR']}`
            : '',
        recipe.duration ? `Preparo: ${recipe.duration}` : '',
        recipe.craftingMultiplier
            ? `Rendimento: ${recipe.craftingMultiplier}${recipe.craftingMultiplierUnit ? ` ${recipe.craftingMultiplierUnit}` : ''}`
            : ''
    ]
        .filter(Boolean)
        .join(' · '),
    materials: recipe.ingredients.map((ingredient): ConstructionMaterial => ({
        name: ingredient.name['pt-BR'],
        amount: ingredient.quantity
    }))
}));

const meads: CatalogEntry[] = meadData.map((mead) => ({
    id: `mead_${mead.id}`,
    name: mead.name['pt-BR'],
    nameEn: mead.name.en,
    aliases: [...mead.aliases['pt-BR'], ...mead.aliases.en],
    kind: 'mead',
    icon: 'portal',
    outputQuantity: mead.recipeOutput,
    unitDescription: [
        `Rendimento: ${mead.recipeOutput}`,
        mead.effect['pt-BR'] ? `Efeito: ${mead.effect['pt-BR']}` : '',
        mead.duration ? `Duração: ${mead.duration}` : '',
        mead.cooldown ? `Recarga: ${mead.cooldown}` : ''
    ]
        .filter(Boolean)
        .join(' · '),
    materials: mead.ingredients.map((ingredient): ConstructionMaterial => ({
        name: ingredient.name['pt-BR'],
        amount: ingredient.quantity
    }))
}));

const armors: CatalogEntry[] = armorData.map((armor) => ({
    id: `armor_${armor.id}`,
    name: armor.name['pt-BR'],
    nameEn: armor.name.en,
    aliases: [...armor.aliases['pt-BR'], ...armor.aliases.en],
    kind: 'armor',
    icon: 'chest',
    unitDescription: [
        'Qualidade: 1',
        `Armadura: ${armor.armorByQuality[0]}`,
        `Peso: ${armor.weight}`,
        armor.craftingStation?.name['pt-BR']
            ? `Estação: ${armor.craftingStation.name['pt-BR']}`
            : '',
        armor.additionalEffects['pt-BR'] ? `Efeito: ${armor.additionalEffects['pt-BR']}` : ''
    ]
        .filter(Boolean)
        .join(' · '),
    materials: armor.ingredients.flatMap((ingredient): ConstructionMaterial[] => {
        const amount = ingredient.quantityByQuality[0];
        return typeof amount === 'number' ? [{ name: ingredient.name['pt-BR'], amount }] : [];
    })
}));

const weaponCategoryLabels: Record<string, string> = {
    Axes: 'Machados',
    Clubs: 'Clavas',
    Swords: 'Espadas',
    Spears: 'Lanças',
    Polearms: 'Armas de haste',
    Knives: 'Facas',
    Fists: 'Punhos',
    Shields: 'Escudos',
    Bows: 'Arcos',
    Crossbows: 'Bestas',
    'Elemental magic': 'Magia elemental',
    'Blood magic': 'Magia de sangue',
    Arrows: 'Flechas',
    Bolts: 'Virotes',
    Missiles: 'Projéteis',
    Bombs: 'Bombas',
    'Blob bombs': 'Bombas de gosma'
};

function weaponMaterialsFor(weaponId: string): ConstructionMaterial[] {
    const recipe = weaponMaterialData.recipes.find((entry) => entry.weaponId === weaponId);
    if (!recipe) {
        return [];
    }

    return recipe.ingredients.map((ingredient) => {
        const material = weaponMaterialData.materials.find(
            (entry) => entry.id === ingredient.materialId
        );
        if (!material) {
            throw new TypeError(`Unknown weapon material: ${ingredient.materialId}`);
        }

        return {
            name: material.name['pt-BR'],
            amount: ingredient.quantity
        };
    });
}

const weapons: CatalogEntry[] = weaponData.map((weapon) => {
    const category = weaponCategoryLabels[weapon.category];
    if (!category) {
        throw new TypeError(`Unknown weapon category: ${weapon.category}`);
    }

    return {
        id: `weapon_${weapon.id}`,
        name: weapon.name['pt-BR'],
        nameEn: weapon.name.en,
        aliases: [...weapon.aliases['pt-BR'], ...weapon.aliases.en],
        kind: 'weapon',
        icon: 'sword',
        unitDescription: `Categoria: ${category}`,
        materials: weaponMaterialsFor(weapon.id)
    };
});

const existingBuildingNames = new Set(['Workbench', 'Bed', 'Chest', 'Campfire', 'Portal']);
const buildings: CatalogEntry[] = buildingData
    .filter((building) => !existingBuildingNames.has(building.name.en))
    .map((building) => ({
        id: `building_${building.id}`,
        name: building.name['pt-BR'],
        nameEn: building.name.en,
        aliases: [...building.aliases['pt-BR'], ...building.aliases.en],
        kind: 'building',
        icon: 'workbench',
        unitDescription: `Categoria: ${building.categories.map((category) => category['pt-BR']).join(', ')}`,
        materials: []
    }));

export const valheimDatabaseItems: CatalogEntry[] = [
    ...recipes,
    ...meads,
    ...armors,
    ...weapons,
    ...buildings
];
