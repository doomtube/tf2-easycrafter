
const prompts = require('prompts');

const { LogLevel, LogColors } = require('./constants.js');
const TF2Engine = require('./tf2Engine.js');
const ConsoleManager = require('./cli.js')


function setupListeners(engine) {
    engine.on('log', ({ message, level, timestamp }) => {
        // Format: HH:MM:SS
        const time = new Date(timestamp).toLocaleTimeString('en-GB', { hour12: false });
        const displayLevel = level.toUpperCase().padEnd(5)
        const color = LogColors[level] || LogColors.reset;
        console.log(`${LogColors.DIM}[${time}]:${LogColors.RESET} ${color}${displayLevel}${LogColors.RESET} ${LogColors.DIM}|${LogColors.RESET} ${message}`);
    });
    
    engine.on('inputRequired', async (data) => {
        const response = await prompts({
            type: 'text',
            name: 'input',
            message: data.message
        });
        
        data.callback(response["input"]);
    });
    
    engine.on('needCredentials', async (data) => {
        const response = await prompts([
            { type: 'text', name: 'username', message: 'Steam Username:' },
            { type: 'password', name: 'password', message: 'Steam Password:' }
        ]);
        if (!response.username || !response.password) {
            console.log("Login cancelled. Exiting...");
            process.exit(0);
        }
        data.callback(response);
    });
}

async function runCli() {
    const engine = new TF2Engine();
    
    setupListeners(engine)
    const readyPromise = new Promise(res => engine.once('ready', res));
    
    await engine.start();
    await readyPromise;
    
    console.log("Initialization complete. Starting CLI...");
    const cli = new ConsoleManager(engine);
    await cli.start();
}

runCli();
