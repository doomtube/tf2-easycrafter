
const { LogLevel } = require('./constants.js');
const { MetalType, SlotTokens, TFClasses } = require('./tf2Constants.js')

// 10 seconds
const TIMEOUT_MS = 10000

class Crafter {
    constructor(tf2Instance, logFunction) {
        this.tf2 = tf2Instance;
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

    // --- Crafting Methods ---

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

        /*
        console.log(myMetal);
        console.log(itemsToSmelt);
        */
        
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

        /*
        console.log(myMetal);
        console.log(itemsToSmelt);
        */
                
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
