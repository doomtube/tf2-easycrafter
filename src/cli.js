import readline from 'readline';
import { MetalType, SlotTokens, TFClasses } from './tf2Constants.js';

function parseMetal(target) {
    if (target) {
        target = target.toLowerCase()
    } else {
        return null;
    }

    let targetMetal = null;
    if (target == "scr" || target == "scrap") {
        targetMetal = MetalType.SCRAP;
    } else if (target == "rec" || target == "reclaim" || target == "reclaimed") {
        targetMetal = MetalType.RECLAIMED;
    } else if (target == "ref" || target == "refine" || target == "refined") {
        targetMetal = MetalType.REFINED;
    }
    
    return targetMetal;
}

class ConsoleManager {
    constructor(tf2Engine) {
        this.engine = tf2Engine;
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'TF2-CLI> '
        });

        // Command Registry
        this.commands = {
            // Cmdline-related commands
            'help': {
                description: 'Shows all commands. Provide a command to just show help for that command.\n\t\tUsage: help [command]',
                execute: async (args) => this._handleHelp(args),
                category: 'cmd'
            },
            'quit': {
                description: 'Logs off and closes the bot.',
                execute: async (args) => this._shutdown(args),
                category: 'cmd'
            },

            // Status commands
            'status': {
                description: 'Shows current backpack size and craft item counts.',
                execute: async (args) => this._handleStatus(args),
                category: 'status'
            },
            'junk': {
                description: 'Prints a summary of scrappable items. A scrappable item is a clean item you already have a dupe of.',
                execute: async (args) => this._handleJunkSummary(args),
                category: 'status'
            },

            // Steam-related commands
            'forgetme': {
                description: 'Clears your user login info.',
                execute: async (args) => this._handleForget(args),
                category: 'steam'
            },

            // Craft recipes
            'smelt': {
                description: 'Crafts a specific metal.\n\t\tUsage: smelt <scrap|rec|ref>',
                execute: async (args) => this._handleSmelt(args),
                category: 'craft'
            },
            'combine': {
                description: 'Crafts a specific metal.\n\t\tUsage: combine <scrap|rec|ref>',
                execute: async (args) => this._handleCombine(args),
                category: 'craft'
            },
            'makescrap': {
                description: 'Makes scrap from junk weapons.',
                execute: async (args) => this._handleScrap(args),
                category: 'craft'
            },
            
        };

        // Aliases for commands
        this.aliases = {
            'h':            'help',
            'q':            'quit',
            'exit':         'quit',
            's':            'status',
            'inv':          'status',
            'scrap':        'makescrap',
            'j':            'junk',
            'scrappable':   'junk',
            'forget':       'forgetme',
        };
    }

    // --- INITIALIZATION ---
    async start() {

        console.log('[CLI] CLI starting...');

        this.rl.on('line', async (input) => {
            const rawText = input.trim();
            if (!rawText) {
                this.rl.prompt();
                return;
            }

            // Parse the input
            const parts = rawText.split(' ');
            let commandName = parts[0].toLowerCase();
            const args = parts.slice(1);

            // Strip the slash if the user typed it (minecraft muscle memory lol)
            if (commandName.startsWith('/')) {
                commandName = commandName.substring(1);
            }

            // Command Execution
            const resolvedName = this.aliases[commandName] || commandName;
            const command = this.commands[resolvedName];
            if (command) {
                try {
                    await command.execute(args);
                } catch (err) {
                    console.error(`Error executing '${commandName}': ${err?.message || "Unknown error"}`);
                }
            } else {
                console.log(`Unknown command: '${commandName}'. Type 'help' for a list of commands.`);
            }

            // Reprompt the user when the command finishes.
            // Delay 100ms to let logging finish before reprompt (avoid overlap).
            setTimeout(() => this.rl.prompt(), 100);
        });

        // Catch Ctrl+C (Interrupt Signal)
        this.rl.on('SIGINT', () => {
            this._shutdown();
        });

        // Catch Ctrl+D (EOF / Close Stream)
        this.rl.on('close', () => {
            this._shutdown();
        });

        
        // Startup Dashboard
        console.log("\n  Welcome!");
        await this.commands['status'].execute();
        console.log("  Type 'help' for a list of commands.\n");

        // Initial prompt
        this.rl.prompt();
    }

    // --- COMMAND HANDLERS ---
    
    async _handleHelp(args) {
        if (args.length > 0) {
            // Specific command help
            const target = args[0].replace('/', '');
            const cmd = this.commands[target];
            if (cmd) {
                console.log(`\nCommand: ${target}`);
                console.log(`Description: ${cmd.description}\n`);
            } else {
                console.log(`Command '${target}' not found.`);
            }
        } else {
            // General help list
            console.log('\n ---- Available Commands ----');
            for (const [name, data] of Object.entries(this.commands)) {
                console.log(`  ${name.padEnd(10)} - ${data.description}`);
            }
            console.log('');
        }
    }
    
    async _shutdown() {
        console.log('[CLI] Shutting down...');
        console.log('[CLI] Logging off from Steam...');
        this.engine.logOff();
        console.log('[CLI] CLI terminated.');
        console.log("Goodbye!");
        process.exit(0);
    }

    
    _formatRow(name, count){
        return ` ${name} `.padEnd(29, '.') + ` ${count}`;
    }

    async _handleStatus(args) {
        const items = this.engine.getItemCount();
        const slots = this.engine.getSlots();
        const percent = Math.round((items / slots) * 100);

    
        console.log(' =====================================');
        console.log('   [STATUS] Inventory Overview');
        console.log(' =====================================');
        console.log(`   Backpack Usage : ${items} / ${slots} (${percent}%)`);
        console.log('');
        
        console.log('   --- Crafting Metals ---');
        let foundMetal = false;
        const metalTally = this.engine.crafter.getMetalTally();
        for (const [item, count] of Object.values(metalTally)) {
            if (count > 0) {
                foundMetal = true;
                console.log(this._formatRow(item.displayName, count));
            }
        }
        if (!foundMetal) { console.log(this._formatRow('None', 0)); }
        console.log('');
        
        console.log( this._formatRow("Scrappable Weapons", this.engine.crafter.countJunk()) );
        console.log('');
        
        console.log('   --- Slot Tokens ---');
        let foundSlot = false;
        const slotTokenTally = this.engine.crafter.getSlotTokenTally();
        for (const [item, count] of Object.values(slotTokenTally)) {
            if (count > 0) {
                foundSlot = true;
                console.log(this._formatRow(item.displayName, count));
            }
        }
        if (!foundSlot) { console.log(this._formatRow('None', 0)); }
        console.log('');
        
        console.log('   --- Class Tokens ---');
        let foundClass = false;
        const classTokenTally = this.engine.crafter.getClassTokenTally();
        for (const [item, count] of Object.values(classTokenTally)) {
            if (count > 0) {
                foundClass = true;
                console.log(this._formatRow(item.displayName, count));
            }
        }
        if (!foundClass) { console.log(this._formatRow('None', 0)); }
        console.log('');
        
        console.log(' =====================================');
    }

    async _handleJunkSummary() {
        const junkCounts = this.engine.crafter.getJunkSummary();
        for (const junk of Object.values(junkCounts)) {
            console.log(`  ${this._formatRow(junk.name, junk.count)}`);
        }
    }

    async _handleForget() {
        await this.engine.clearRefreshToken();
    }

    async _handleSmelt(args) {
        if (args.length === 0) {
            console.log("Error: You must specify a metal type. Example: smelt rec");
            return;
        }

        const targetMetal = parseMetal(args[0]);
        if (!targetMetal) {
            console.log("Error: You must specify a valid metal type. Example: smelt ref");
            return;
        }
        
        console.log(`[Crafting] Attempting to smelt ${targetMetal.fullName}...`);
        const res = await this.engine.crafter.smeltMetalDown(targetMetal);
        return res; // idk
    }
    
    async _handleCombine(args) {
        if (args.length === 0) {
            console.log("Error: You must specify a metal type. Example: smelt refined");
            return;
        }

        const targetMetal = parseMetal(args[0]);
        if (!targetMetal) {
            console.log("Error: You must specify a valid metal type. Example: smelt scrap");
            return;
        }
        
        console.log(`[Crafting] Attempting to combine ${targetMetal.fullName}...`);
        const res = await this.engine.crafter.combineMetal(targetMetal);
        return res; // idk
    }

    async _handleScrap() {
        await this.engine.crafter.makeScrap();
    }
    
}

export default ConsoleManager;
