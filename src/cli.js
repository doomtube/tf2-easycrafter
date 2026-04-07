const readline = require('readline');
const { MetalType } = require('./crafter.js');

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
            'help': {
                description: 'Shows all commands. Provide a command to just show help for that command.\n\t\tUsage: help [command]',
                execute: async (args) => this._handleHelp(args)
            },
            'status': {
                description: 'Shows current backpack size and metal counts.',
                execute: async (args) => this._handleStatus(args)
            },
            'exit': {
                description: 'Logs off and closes the bot.',
                execute: async (args) => this._shutdown(args)
            },

            // Craft recipes
            'smelt': {
                description: 'Crafts a specific metal.\n\t\tUsage: craft <scrap|rec|ref>',
                execute: async (args) => this._handleSmelt(args)
            },
            'combine': {
                description: 'Crafts a specific metal.\n\t\tUsage: craft <scrap|rec|ref>',
                execute: async (args) => this._handleCombine(args)
            },
            
        };
    }

    // --- INITIALIZATION ---
    start() {

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
            const command = this.commands[commandName];
            if (command) {
                try {
                    await command.execute(args);
                } catch (err) {
                    console.error(`Error executing '${commandName}':`, err);
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
            console.log('--- Available Commands ---');
            for (const [name, data] of Object.entries(this.commands)) {
                console.log(`${name.padEnd(10)} - ${data.description}`);
            }
            console.log('--------------------------');
        }
    }

    async _handleStatus(args) {
        const items = this.engine.getItemCount();
        const slots = this.engine.getSlots();
        const percent = Math.round((items / slots) * 100);

        const scrap = this.engine.crafter.getMetalCount(MetalType.SCRAP);
        const rec = this.engine.crafter.getMetalCount(MetalType.RECLAIMED);
        const ref = this.engine.crafter.getMetalCount(MetalType.REFINED);

        const formatRow = (name, count) => ` ${name} `.padEnd(26, '.') + ` ${count}`;
    
        console.log('====================================');
        console.log(' [STATUS] Inventory Overview');
        console.log('====================================');
        console.log(` Backpack Usage : ${items} / ${slots} (${percent}%)`);
        console.log('');
        console.log(' --- Crafting Metals ---');
        console.log(formatRow(MetalType.SCRAP.fullName, scrap));
        console.log(formatRow(MetalType.RECLAIMED.fullName, rec));
        console.log(formatRow(MetalType.REFINED.fullName, ref));
        console.log('====================================');
    }
    
    async _shutdown() {
        console.log('[CLI] Shutting down...');
        console.log('[CLI] Logging off from Steam...');
        this.engine.logOff();
        console.log('[CLI] CLI terminated.');
        console.log("Goodbye!");
        process.exit(0);
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
    
}

module.exports = ConsoleManager;
