const prompts = require('prompts');
const { LogLevel } = require('./constants.js');
const { TF2Engine } = require('./tf2Engine.js')

const logColors = {
    [LogLevel.INFO]:    '\x1b[36m', // Cyan
    [LogLevel.WARN]:    '\x1b[33m', // Yellow
    [LogLevel.ERROR]:   '\x1b[31m', // Red
    [LogLevel.DEBUG]:   '\x1b[90m', // Gray
    dim:                '\x1b[2m',
    reset:              '\x1b[0m'
};

async function startREPL(engine) {
    return;
}

function setupListeners(engine) {
    engine.on('log', ({ message, level, timestamp }) => {
        // Format: HH:MM:SS
        const time = new Date(timestamp).toLocaleTimeString('en-GB', { hour12: false });
        const displayLevel = level.toUpperCase().padEnd(5)
        const color = logColors[level] || logColors.reset;
        console.log(`${logColors.dim}[${time}]:${logColors.reset} ${color}${displayLevel}${logColors.reset} ${logColors.dim}|${logColors.reset} ${message}`);
    });
    
    engine.on('inputRequired', async (data) => {
        const response = await prompts({
            type: 'text',
            name: 'code',
            message: data.message
        });
        
        if (!response.code) {
            console.log("Cancelled auth. Exiting...");
            process.exit(0);
        }
        
        data.callback(response.code);
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

async function main() {
    const engine = new TF2Engine();
    
    setupListeners(engine)
    const readyPromise = new Promise(res => engine.once('ready', res));
    
    await engine.start();
    await readyPromise;
    
    console.log("Initialization complete.");
    await startREPL(engine)
    console.log("Goodbye!");
    process.exit(0);
}

main();
