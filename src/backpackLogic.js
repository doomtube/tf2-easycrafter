module.exports = { processInventory };

// "Main" logic. Called when backpack loaded
function processInventory(backpack, itemSheet) {
    // Item format check
    if (backpack.length > 0) {
        console.log(backpack[0]);
    }

    /*
    // Dump inventory
    for (const item of backpack) {
        let details = itemSheet[item.def_index]
        console.log(`${details["defindex"]}:\t ${details["name"]} || ${details["item_name"]}`)
    }*/
    
    
    // Test
    const refined = backpack.filter(item => item.def_index === 5002);
    console.log(`You have ${refined.length} Refined Metal.`);
    if (refined.length > 0) {
        console.log(refined[0]);
        console.log(itemSheet[refined[0].def_index]);
    }
}

