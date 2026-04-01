
// 10 seconds
const TIMEOUT_MS = 10000

// Craft metal reference
const MetalType = {
    SCRAP:      { name: 'scrap',    fullName: 'Scrap Metal',        def: 5000, next: null, prev: null },
    RECLAIMED:  { name: 'rec',      fullName: 'Reclaimed Metal',    def: 5001, next: null, prev: null },
    REFINED:    { name: 'ref',      fullName: 'Refined Metal',      def: 5002, next: null, prev: null }
};

MetalType.SCRAP.next = MetalType.RECLAIMED;
MetalType.RECLAIMED.next = MetalType.REFINED;

MetalType.RECLAIMED.prev = MetalType.SCRAP;
MetalType.REFINED.prev = MetalType.RECLAIMED;

Object.freeze(MetalType.SCRAP);
Object.freeze(MetalType.RECLAIMED);
Object.freeze(MetalType.REFINED);
Object.freeze(MetalType);


// Token def id's
const TOKEN_SNIPER = 5004
const TOKEN_MELEE = 5014


class Crafter {
    constructor(tf2Instance) {
        this.tf2 = tf2Instance;
    }

    // Ensures existence of certain metal only by smelting larger metal.
    // Returns false if unable to ensure.
    async ensureMetalDown(metalType) {
        console.log(`Ensuring ${metalType.name}...`);
        if (this._getAll(metalType.def).length > 0) {
            console.log(`${metalType.fullName} found in inventory!`);
            return true;
        }

        if (metalType.next == null) {
            console.log(`Missing ${metalType.name}. Cannot smelt larger metal.`);
            return false;
        } else {
            console.log(`Missing ${metalType.name}. Attempting to smelt larger metal...`);
        }
        
        const preSatisfied = await this.ensureMetalDown(metalType.next)
        if (!preSatisfied) {
            return false
        }
        
        console.log(`Smelting 1 ${metalType.next.name} into 3 ${metalType.name}...`);
        const success = await this.smeltMetalDown(metalType.next);
        if (success) {
            console.log(`${metalType.fullName} obtained!`);
        } else {
            console.log(`Failed to obtain ${metalType.fullName}.`);
        }
        return success;
    }

    async smeltMetalDown(metalType) {
        if (metalType.prev == null) {
            console.log("Attempted to smelt down unsmeltable metal! Aborting...");
            return false;
        }

        const myMetal = this._getAll(metalType.def)
        if (myMetal.length < 1) {
            console.log(`No valid ${metalType.name} to smelt! Aborting...`);
            return false;
        }
        const itemsToSmelt = [myMetal[0].id];

        /*
        console.log(myMetal);
        console.log(itemsToSmelt);
        */
        
        console.log(`Sending craft request to smelt ${metalType.name}...`);
        this.tf2.craft(itemsToSmelt);
        const success = await this._waitForCraft();
        if (!success) {
            console.log("Smelting craft failed!");
            return false;
        }
        console.log("Smelting craft Completed!");
        return true;
    }

    // Craft specified metal into next highest metal
    async combineMetal(metalType) {
        if (metalType.next == null) {
            console.log(`Cannot create larger metal from 3 ${metalType.name}! Aborting...`);
            return false;
        }
        
        console.log(`Attempting to combine 3 ${metalType.name} into 1 ${metalType.next.name}...`);
        
        const myMetal = this._getAll(metalType.def);
        if (myMetal.length < 3) {
            console.log(`Insufficient ${metalType.fullName} (have ${myMetal.length}, need 3)! Aborting...`);
            return false;
        }
        const itemsToSmelt = myMetal.slice(0, 3).map(metal => metal.id);

        /*
        console.log(myMetal);
        console.log(itemsToSmelt);
        */
                
        console.log(`Sending craft request to combine ${metalType.name}...`);
        this.tf2.craft(itemsToSmelt);
        const success = await this._waitForCraft();
        if (!success) {
            console.log("Craft failed!");
            return false;
        }
        console.log("Craft Completed!");
        return true;
    }

    // Listens for craftingComplete event, default timeout
    _waitForCraft(timeoutMs = TIMEOUT_MS) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.warn("Crafting request timed out. The Game Coordinator might be down.");
                this.tf2.removeAllListeners('craftingComplete');
                resolve(false);
            }, timeoutMs);

            this.tf2.once('craftingComplete', (recipe, itemsGained) => {
                clearTimeout(timeout);
                if (recipe < 0) {
                    console.log(`Craft Failed (recipe ${recipe}, gained ${itemsGained.length} items).`);
                    resolve(false);
                } else {
                    console.log(`Craft successful! Gained ${itemsGained.length} items using recipe ${recipe}.`);
                    resolve(true);
                }
            });
        })
    }

    _getAll(def) {
        return this.tf2.backpack.filter(item => item.def_index === def);
    }

}

module.exports = { 
    Crafter, 
    MetalType 
};
