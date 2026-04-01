const { Crafter, MetalType } = require('./crafter.js');

// Returns false if item isnt a basic weapon, has special qualities, is equipped, is named/painted, etc.
function isJunk(item) {
    //wip
    return false
}

// "Main" logic. Called when backpack loaded
async function processInventory(tf2, itemSheet) {

    /*
    // Dump inventory
    for (const item of tf2.backpack) {
        const details = itemSheet[item.def_index]
        console.log(`${details["defindex"]}:\t ${details["name"]} || ${details["item_name"]}`)
    }*/
    
    /*
    // Test
    const refined = tf2.backpack.filter(item => item.def_index === 5002);
    console.log(`You have ${refined.length} Refined Metal.`);
    if (refined.length > 0) {
        console.log(refined[0]);
        console.log(itemSheet[refined[0].def_index]);
    }*/

    const myCrafter = new Crafter(tf2);
    await myCrafter.ensureMetalDown(MetalType.SCRAP);
    await myCrafter.combineMetal(MetalType.SCRAP);
    //await myCrafter.smeltMetalDown(MetalType.SCRAP);
    //await myCrafter.smeltMetalDown(MetalType.REFINED);
    //await myCrafter.smeltMetalDown(MetalType.RECLAIMED);
    await myCrafter.combineMetal(MetalType.RECLAIMED);

    
}

module.exports = { processInventory };
