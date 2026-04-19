// High-value Unique weapons that shouldn't be used in crafting.
const ProtectedWeapons = new Set([
    // --- Meme Melees ---
    264,   // Frying Pan
    474,   // Conscientious Objector
    880,   // Freedom Staff
    939,   // Bat Outta Hell
    954,   // Memory Maker
    1013,  // Ham Shank
    1123,  // Necro Smasher
    1127,  // Crossing Guard
    30758, // Prinny Machete

    // --- High-Value Promo Reskins ---
    294,   // Lugermorph
    161,   // Big Kill
    298,   // Iron Curtain
    297,   // Enthusiast's Timepiece
    452,   // Three-Rune Blade
    466,   // Maul
    572,   // Unarmed Combat
    574,   // Wanga Prick
    587,   // Apoco-Fists
    638,   // Sharp Dresser
    727,   // Black Rose
    851,   // AWPer Hand
    947,   // Quäckenbirdt

    // --- Love & War "Bread" Reskins ---
    1100,  // Bread Bite
    1102,  // Snack Attack
    1105,  // Self-Aware Beauty Mark
    1121,  // Mutated Milk

    // --- Invasion Update Reskins ---
    30665, // Shooting Star
    30666, // C.A.P.P.E.R
    30667, // Batsaber
    30668, // Giger Counter
]);
Object.freeze(ProtectedWeapons);

// Schema-related
const ItemQuality = {
    NORMAL: 0,
    GENUINE: 1,
    VINTAGE: 3,
    UNUSUAL: 5,
    UNIQUE: 6,
    COMMUNITY: 7,
    VALVE: 8,
    SELFMADE: 9,
    CUSTOM: 10,
    STRANGE: 11,
    HAUNTED: 13,
    COLLECTORS: 14,
    DECORATED: 15
};
Object.freeze(ItemQuality);

const ItemOrigin = {
    TIMED_DROP: 0,
    ACHIEVEMENT: 1,
    PURCHASED: 2,
    TRADED: 3,
    CRAFTED: 4,
    STORE_PROMOTION: 5,
    GIFTED: 6,
    SUPPORT_GRANTED: 7,
    FOUND_IN_CRATE: 8,
    QUEST_LOANER_ITEM: 24,
    UNTRADABLE_FREE_CONTRACT_REWARD: 29
};
Object.freeze(ItemOrigin);

const UntradeableOrigins = new Set([
    ItemOrigin.ACHIEVEMENT, 
    ItemOrigin.STORE_PROMOTION, 
    ItemOrigin.SUPPORT_GRANTED, 
    ItemOrigin.QUEST_LOANER_ITEM, 
    ItemOrigin.UNTRADABLE_FREE_CONTRACT_REWARD
]);
Object.freeze(UntradeableOrigins);

const UncraftableOrigins = new Set([
    ItemOrigin.PURCHASED, 
    ItemOrigin.STORE_PROMOTION, 
    ItemOrigin.QUEST_LOANER_ITEM
]);
Object.freeze(UncraftableOrigins);

const ItemAttribute = {
    CANNOT_TRADE: 153,
    NEVER_CRAFTABLE: 449
};
Object.freeze(ItemAttribute);

const ItemCraftType = {
    WEAPON: "weapon"
};
Object.freeze(ItemCraftType);

const ItemEquipSlot = {
    PRIMARY: "primary",
    SECONDARY: "secondary",
    MELEE: "melee"
};
Object.freeze(ItemEquipSlot);

// Craft metals
const MetalType = {
    SCRAP:      { name: 'scrap',    fullName: 'Scrap Metal',        displayName: 'Scrap Metal',      def: 5000, next: null, prev: null },
    RECLAIMED:  { name: 'rec',      fullName: 'Reclaimed Metal',    displayName: 'Reclaimed Metal',  def: 5001, next: null, prev: null },
    REFINED:    { name: 'ref',      fullName: 'Refined Metal',      displayName: 'Refined Metal',    def: 5002, next: null, prev: null }
};
MetalType.SCRAP.next        = MetalType.RECLAIMED;
MetalType.RECLAIMED.next    = MetalType.REFINED;
MetalType.RECLAIMED.prev    = MetalType.SCRAP;
MetalType.REFINED.prev      = MetalType.RECLAIMED;
Object.values(MetalType).forEach(Object.freeze);
Object.freeze(MetalType);

// Slot tokens
const SlotTokens = {
    PRIMARY:    { name: 'token_primary',    fullName: 'Slot Token - Primary',   displayName: 'Primary Token',   schemaSlot: ItemEquipSlot.PRIMARY,      def: 5012 },
    SECONDARY:  { name: 'token_secondary',  fullName: 'Slot Token - Secondary', displayName: 'Secondary Token', schemaSlot: ItemEquipSlot.SECONDARY,    def: 5013 },
    MELEE:      { name: 'token_melee',      fullName: 'Slot Token - Melee',     displayName: 'Melee Token',     schemaSlot: ItemEquipSlot.MELEE,        def: 5014 }
};
Object.values(SlotTokens).forEach(Object.freeze);
Object.freeze(SlotTokens);

// TF2 Classes
const TFClasses = {
    SCOUT: {
        id: 1,
        name: 'scout',
        fullName: 'Scout',
        token: { name: 'token_scout', fullName: 'Class Token - Scout', displayName: 'Scout Token', schemaClass: 'Scout', def: 5003 }
    },
    SOLDIER: {
        id: 2,
        name: 'soldier',
        fullName: 'Soldier',
        token: { name: 'token_soldier', fullName: 'Class Token - Soldier', displayName: 'Soldier Token', schemaClass: 'Soldier', def: 5005 }
    },
    PYRO: {
        id: 3,
        name: 'pyro',
        fullName: 'Pyro',
        token: { name: 'token_pyro', fullName: 'Class Token - Pyro', displayName: 'Pyro Token', schemaClass: 'Pyro', def: 5009 }
    },
    DEMOMAN: {
        id: 4,
        name: 'demo',
        fullName: 'Demoman',
        token: { name: 'token_demo', fullName: 'Class Token - Demo', displayName: 'Demo Token', schemaClass: 'Demoman', def: 5006 }
    },
    HEAVY: {
        id: 5,
        name: 'heavy',
        fullName: 'Heavy',
        token: { name: 'token_heavy', fullName: 'Class Token - Heavy', displayName: 'Heavy Token', schemaClass: 'Heavy', def: 5007 }
    },
    ENGI: {
        id: 6,
        name: 'engi',
        fullName: 'Engineer',
        token: { name: 'token_engi', fullName: 'Class Token - Engineer', displayName: 'Engi Token', schemaClass: 'Engineer', def: 5011 }
    },
    SNIPER: {
        id: 7,
        name: 'sniper',
        fullName: 'Sniper',
        token: { name: 'token_sniper', fullName: 'Class Token - Sniper', displayName: 'Sniper Token', schemaClass: 'Sniper', def: 5004 }
    },
    MEDIC: {
        id: 8,
        name: 'medic',
        fullName: 'Medic',
        token: { name: 'token_medic', fullName: 'Class Token - Medic', displayName: 'Medic Token', schemaClass: 'Spy', def: 5008 }
    },
    SPY: {
        id: 9,
        name: 'spy',
        fullName: 'Spy',
        token: { name: 'token_spy', fullName: 'Class Token - Spy', displayName: 'Spy Token', def: 5010 }
    }
};
Object.values(TFClasses).forEach( (tfClass) => {
    Object.freeze(tfClass.token);
    Object.freeze(tfClass);
});
Object.freeze(TFClasses);

export {
    ProtectedWeapons,
    
    ItemQuality,
    ItemOrigin,
    UntradeableOrigins,
    UncraftableOrigins,
    ItemCraftType,
    ItemEquipSlot,
    
    MetalType,
    SlotTokens,
    
    TFClasses,
};
