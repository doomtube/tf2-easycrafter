
// 10 seconds
const TIMEOUT_MS = 10000

// Craft metal reference
const MetalType = {
    SCRAP: { name: 'scrap', fullName: 'Scrap Metal', def: 5000, pre: null, post: null },
    RECLAIMED: { name: 'rec', fullName: 'Reclaimed Metal', def: 5001, pre: null, post: null },
    REFINED: { name: 'ref', fullName: 'Refined Metal', def: 5002, pre: null, post: null }
};

MetalType.SCRAP.pre = MetalType.RECLAIMED;
MetalType.RECLAIMED.pre = MetalType.REFINED;

MetalType.RECLAIMED.post = MetalType.SCRAP;
MetalType.REFINED.post = MetalType.RECLAIMED;

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

        if (metalType.pre == null) {
            console.log(`Missing ${metalType.name}. Cannot smelt larger metal.`);
            return false;
        } else {
            console.log(`Missing ${metalType.name}. Attempting to smelt larger metal...`);
        }
        
        const preSatisfied = await this.ensureMetalDown(metalType.pre)
        if (!preSatisfied) {
            return false
        }
        
        console.log(`Smelting 1 ${metalType.pre.name} into 3 ${metalType.name}...`);
        const success = await this._smeltMetalDown(metalType.pre);
        if (success) {
            console.log(`${metalType.fullName} obtained!`);
        }
        return success;
    }
    
    _getAll(def) {
        return this.tf2.backpack.filter(item => item.def_index === def);
    }

    async _smeltMetalDown(metalType) {
        if (metalType.post == null) {
            console.log("Attempted to smelt down unsmeltable metal! Aborting...");
            return false;
        }

        const myMetal = this._getAll(metalType.def)
        if (myMetal.length < 1) {
            console.log(`No valid ${metalType.name} to smelt! Aborting...`);
            return false;
        }
        const itemsToSmelt = [myMetal[0]["id"]];

        console.log(myMetal);
        console.log(itemsToSmelt);
                
        console.log(`Sending craft request to smelt ${metalType.name}...`);
        this.tf2.craft(itemsToSmelt);
        const success = await this._waitForCraft();
        if (!success) {
            console.log("Smelting craft failed! Aborting...");
            return false;
        }
        console.log("Smelting craft Completed!");
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
                console.log(`Craft successful! Gained ${itemsGained.length} items using recipe ${recipe}.`);
                resolve(true);
            });
        })
    }

}

module.exports = { 
    Crafter, 
    MetalType 
};
