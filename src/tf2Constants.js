
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
    PRIMARY:    { name: 'token_primary',    fullName: 'Slot Token - Primary',   displayName: 'Primary Token',   schemaSlot: "primary",      def: 5012 },
    SECONDARY:  { name: 'token_secondary',  fullName: 'Slot Token - Secondary', displayName: 'Secondary Token', schemaSlot: "secondary",    def: 5013 },
    MELEE:      { name: 'token_melee',      fullName: 'Slot Token - Melee',     displayName: 'Melee Token',     schemaSlot: "melee",        def: 5014 }
}
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

module.exports = { MetalType, SlotTokens, TFClasses }
