
const { LogLevel } = require('./constants.js');

const {
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
} = require('./tf2Constants.js')

// 10 seconds
const TIMEOUT_MS = 10000

class Crafter {
    constructor(tf2Instance, itemSheet, logFunction) {
        this.tf2 = tf2Instance;
        this.itemSheet = itemSheet;
        this._log = logFunction;
    }

    // --- Accessor Methods ---

    getMetalTally() {
        return this._getCountsFor(Object.values(MetalType));
    }

    getSlotTokenTally() {
        return this._getCountsFor(Object.values(SlotTokens), this.tf2.backpack);
    }

    getClassTokenTally() {
        const classTokens = Object.values(TFClasses).map((cls) => cls.token);
        return this._getCountsFor(classTokens, this.tf2.backpack); 
    }

    // Counts "scrappable" items
    countJunk() {
        return this._getJunkItems().length
    }

    getJunkSummary() {
        const itemPool = this._getJunkItems();
        const summary = {}
        for (const item of itemPool) {
            if (!summary[item.def_index]) {
                summary[item.def_index] = {name: this.itemSheet[item.def_index]["item_name"], count: 1};
            } else {
                summary[item.def_index].count += 1;
            }
        }

        return summary;
    }

    // --- Crafting Methods ---
    
    // ------ METAL ------

    // Ensures existence of certain metal only by smelting larger metal.
    // Returns false if unable to ensure.
    async ensureMetalDown(metalType) {
        this._log(`Ensuring ${metalType.name}...`);
        if (this._getAll(metalType.def).length > 0) {
            this._log(`${metalType.fullName} found in inventory!`);
            return true;
        }

        if (metalType.next == null) {
            this._log(`Missing ${metalType.name}. Cannot smelt larger metal.`, LogLevel.WARN);
            return false;
        } else {
            this._log(`Missing ${metalType.name}. Attempting to smelt larger metal...`);
        }
        
        const preSatisfied = await this.ensureMetalDown(metalType.next)
        if (!preSatisfied) {
            return false
        }
        
        this._log(`Smelting 1 ${metalType.next.name} into 3 ${metalType.name}...`);
        const success = await this.smeltMetalDown(metalType.next);
        if (success) {
            this._log(`${metalType.fullName} obtained!`);
        } else {
            this._log(`Failed to obtain ${metalType.fullName}.`, LogLevel.WARN);
        }
        return success;
    }

    async smeltMetalDown(metalType) {
        if (metalType.prev == null) {
            this._log("Attempted to smelt down unsmeltable metal! Aborting...", LogLevel.WARN);
            return false;
        }

        const myMetal = this._getAll(metalType.def)
        if (myMetal.length < 1) {
            this._log(`No valid ${metalType.name} to smelt! Aborting...`, LogLevel.WARN);
            return false;
        }
        const itemsToSmelt = [myMetal[0].id];

        this._log(`Sending craft request to smelt ${metalType.name}...`);
        this.tf2.craft(itemsToSmelt);
        const success = await this._waitForCraft();
        if (!success) {
            this._log("Smelting craft failed!", LogLevel.WARN);
            return false;
        }
        this._log("Smelting craft Completed!");
        return true;
    }

    // Craft specified metal into next highest metal
    async combineMetal(metalType) {
        if (metalType.next == null) {
            this._log(`Cannot create larger metal from 3 ${metalType.name}! Aborting...`, LogLevel.WARN);
            return false;
        }
        
        this._log(`Attempting to combine 3 ${metalType.name} into 1 ${metalType.next.name}...`);
        
        const myMetal = this._getAll(metalType.def);
        if (myMetal.length < 3) {
            this._log(`Insufficient ${metalType.fullName} (have ${myMetal.length}, need 3)! Aborting...`, LogLevel.WARN);
            return false;
        }
        const itemsToSmelt = myMetal.slice(0, 3).map(metal => metal.id);
                
        this._log(`Sending craft request to combine ${metalType.name}...`);
        this.tf2.craft(itemsToSmelt);
        const success = await this._waitForCraft();
        if (!success) {
            this._log("Craft failed!", LogLevel.WARN);
            return false;
        }
        this._log("Craft Completed!");
        return true;
    }

    // Junk weapons to scrap (default excludes melees and snipers' because they are useful for crafting objectors)
    async makeScrap(keepCleanSpare = true, useEquipped = false, excludeSlots = [ItemEquipSlot.MELEE], excludeClasses = [TFClasses.SNIPER]) {
        const [target1, target2] = this._getBestJunkPair(keepCleanSpare, useEquipped, excludeSlots, excludeClasses);
        this._log(`SMELT TARGETS:\n${this.itemSheet[target1.def_index].item_name}\n${this.itemSheet[target2.def_index].item_name}`, LogLevel.INFO);
        // TODO: Possibly make it confirm with the user before starting the craft
    }

    // ------ TOKENS ------

    async craftClassToken(tokenType) {
        //TODO
    }

    async craftSlotToken(tokenType) {
        //TODO
    }

    // ------ Filtering Helpers ------

    _itemIsCraftable(item) {
        if (UncraftableOrigins.has(item.origin)) { return false };

        if (item.attribute && item.attribute.some(attr => attr.def_index === ItemAttribute.NEVER_CRAFTABLE)) {
            return false;
        }

        return true; 
    }

    _itemIsTradeable(item) {
        if (UntradeableOrigins.has(item.origin)) { return false };

        if (item.attribute && item.attribute.some(attr => attr.def_index === ItemAttribute.CANNOT_TRADE)) {
            return false;
        }

        return true;
    }
    
    _itemIsEquipped(item) {
        return (item.equipped_state && item.equipped_state.length > 0);
    }

    _itemIsWeapon(item) {
        return (this.itemSheet[item.def_index]["craft_material_type"] == ItemCraftType.WEAPON);
    }

    // unused in junk check
    _itemIsEquipSlot(equipSlot, item) {
        return (this.itemSheet[item.def_index]["item_slot"] == equipSlot);
    }

    // unused in junk check
    _itemBelongsToClass(tfClass, item) {
        const usedClasses = this.itemSheet[item.def_index]["used_by_classes"];
        // In the schema, null means allclass
        return (usedClasses == null || usedClasses.includes(tfClass.token.schemaClass));
    }

    // Does NOT check for dupes!
    _itemIsPossibleJunk(item, useEquipped, excludeSlots, excludeClasses) {

        if ( ProtectedWeapons.has(item.def_index) ) { return false; } // Valuable uniques
        if ( item.quality !== ItemQuality.UNIQUE ) { return false; }
        if ( item.custom_name || item.custom_desc ) { return false; }
        if ( item.attribute && item.attribute.length > 0 ) { return false; } // (Killstreaks, Spells, Parts, Festivizers)

        if ( !useEquipped && this._itemIsEquipped(item) ) { return false; }
        if ( excludeSlots && excludeSlots.includes(this.itemSheet[item.def_index]["item_slot"]) ) { return false; }

        const usedClasses = this.itemSheet[item.def_index]["used_by_classes"];
        const isAllClass = usedClasses == null;
        // If any of the excluded classes are in the used classes, then it's not junk
        if ( excludeClasses && !isAllClass && excludeClasses.some((cls) => usedClasses.includes(cls)) ) { return false; }
        
        return (
            this._itemIsCraftable(item) &&
            this._itemIsTradeable(item) &&
            this._itemIsWeapon(item)
        );
    }
    
    // Filters backpack into just items that are able to be scrapped
    _getJunkItems(keepCleanSpare, useEquipped, excludeSlots, excludeClasses) {
    
        const weapons = this.tf2.backpack.filter(item => this._itemIsWeapon(item));

        // Group weapons by def index
        // This will create seperate groups for decorated weapons, original festives, and other random things.
        // Solution would be to map "weird" weapons to their original def. Not worth the time tbh.
        const weaponGroups = {};
        for (const weapon of weapons) {
            const def = weapon.def_index;
            
            if (!weaponGroups[def]) { weaponGroups[def] = []; }
            
            weaponGroups[def].push(weapon);
        }

        // Whittle down the junk groups
        const finalJunkPool = [];
        for (const group of Object.values(weaponGroups)) {
        
            const originalCount = group.length;

            // Only keep "clean" weapons in the junk pile
            let junkableItems = group.filter( (item) =>
                this._itemIsPossibleJunk(item, useEquipped, excludeSlots, excludeClasses)
            );

            // If items were not stripped from the group (or we always want to keep a clean spare),
            //  strip one clean item from the junk group.
            if (keepCleanSpare || junkableItems.length == originalCount) {
                junkableItems.pop();
            }

            // Push each item onto the final junk pool
            finalJunkPool.push(...junkableItems);
        }

        return finalJunkPool;
        
    }

    // Used in junk pair algorithm
    _getItemFlexibility(item) {
        const usedClasses = this.itemSheet[item.def_index]["used_by_classes"];
        // If it has specific classes, return that number. 
        // If it's null (all-class), return 9 so it gets sorted to the very back
        return usedClasses ? usedClasses.length : Object.keys(TFClasses).length;
    }

    // Gets the best pair of junk items to turn to scrap
    _getBestJunkPair(keepCleanSpare = true, useEquipped = false, excludeSlots = [ItemEquipSlot.MELEE], excludeClasses = [TFClasses.SNIPER]) {
    
        const itemPool = this._getJunkItems(keepCleanSpare, useEquipped, excludeSlots, excludeClasses);

        // Sort the pool with most restrictive weapons at the front (we want to use them before multiclass weps)
        itemPool.sort((a, b) => this._getItemFlexibility(a) - this._getItemFlexibility(b));

        const ALL_CLASSES = Object.values(TFClasses);

        // N^2 Search to find a pair with matching classes
        for (let i = 0; i < itemPool.length; i++) {
            const item1 = itemPool[i];
            let classes1 = this.itemSheet[item1.def_index]["used_by_classes"] || ALL_CLASSES;

            for (let j = i + 1; j < itemPool.length; j++) {
                const item2 = itemPool[j];
                let classes2 = this.itemSheet[item2.def_index]["used_by_classes"] || ALL_CLASSES;

                if (classes1.some( (cls) => classes2.includes(cls) )) {
                    return [item1, item2]; 
                }
            }
        }

        // If the loops finish and find nothing, return null
        return null; 
    }

    // ------ Craft Helpers ------

    // Listens for craftingComplete event, default timeout
    _waitForCraft(timeoutMs = TIMEOUT_MS) {
        return new Promise((resolve) => {
        
            const timeout = setTimeout(() => {
                this._log("Crafting request timed out. The Game Coordinator might be down.", LogLevel.WARN);
                this.tf2.removeAllListeners('craftingComplete');
                resolve(false);
            }, timeoutMs);

            this.tf2.once('craftingComplete', (recipe, itemsGained) => {
                clearTimeout(timeout);
                if (recipe < 0) {
                    this._log(`Craft Failed (recipe ${recipe}, gained ${itemsGained.length} items).`, LogLevel.WARN);
                    resolve(false);
                } else {
                    this._log(`Craft successful! Gained ${itemsGained.length} items using recipe ${recipe}.`, LogLevel.DONE);
                    resolve(true);
                }
            });
        })
    }

    // Generic tally helper (used for getMetalTally and getTokenTally)
    _getCountsFor(targetItemsArray) {
        const result = {};
        const lookup = {};
    
        // Build lookup and initialize
        for (const target of targetItemsArray) {
            lookup[target.def] = target.name;
            // Initialize to tuple so we can refer to the original object when looping through the result
            result[target.name] = [target, 0];
        }
    
        // Single-Pass Tally
        for (const item of this.tf2.backpack) {
            const matchName = lookup[item.def_index];
            if (matchName) {
                result[matchName][1]++;
            }
        }
    
        return result;
    }

    _getAll(def) {
        return this.tf2.backpack.filter(item => item.def_index === def);
    }

}

module.exports = Crafter;
