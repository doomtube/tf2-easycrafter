const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

const SteamUser = require('steam-user');
const TeamFortress2 = require('tf2');
const StaticSchema = require('tf2-static-schema/static/items.json');

const { LogLevel } = require('./constants.js');
const Crafter = require('./crafter.js');

// Config
const PROGRAM_NAME = "TF2-EasyCrafter"
const DATA_DIR = path.join(__dirname, '..', 'data');
const USER_DATA_DIR = path.join(DATA_DIR, 'node-steamuser');
const TOKEN_PATH = path.join(DATA_DIR, 'refresh_token.json');


class TF2Engine extends EventEmitter {
    
    constructor() {
        super(); // Required for EventEmitter
        this.user = null;
        this.tf2 = null;
        this.itemSheet = {}; // Item schema, indexed by defIndex

        // Public
        this.crafter = null;
    }

    // Accessors
    getItemCount() { return this.tf2.backpack.length; }
    getSlots() { return this.tf2.backpackSlots; }

    // Initialization
    async start() {
        
        this._log("Initializing...");
    
        // Directory initialization
        if (!fs.existsSync(DATA_DIR)) { fs.mkdirSync(DATA_DIR, { recursive: true }); }
        
        this.user = new SteamUser({ dataDirectory: USER_DATA_DIR });
        this.tf2 = new TeamFortress2(this.user);

        // ItemSheet initialization
        StaticSchema.forEach(item => { this.itemSheet[item.defindex] = item; });

        this.crafter = new Crafter(
            this.tf2,
            this.itemSheet,
            (msg, lvl) => this._log(msg, lvl) // arrow func to preserve the scope of "this"
        )
        
        this._setupEventListeners();

        
        this._log("Initiating Logon...");
        await this._logon();
    }

    async logOff() {
        
        // TODO: idk how to properly log off
        this._log("Logging off from Steam (ungracefully)...");
        
    }

    async _logon() {
        // Try refreshToken
        if (this._tryRefreshToken()) { return; }
        
        // No token, prompt username/pass
        const creds = await this._requestCredentials();
        this.user.logOn(creds);
        
    }

    _tryRefreshToken() {
        if (!fs.existsSync(TOKEN_PATH)) {
            return false;
        }
        
        try {
            const fileContent = fs.readFileSync(TOKEN_PATH, 'utf8');
            const sessionData = JSON.parse(fileContent);

            if (sessionData.token) {
                this._log("Found saved session. Logging in...");
                this.user.logOn({
                    refreshToken: sessionData.token,
                    machineName: PROGRAM_NAME
                });
                return true;
            }
            
        } catch (err) {
            this._log("An error occured while reading saved token. Ignoring token...", LogLevel.WARN);
            this._log(err.message, LogLevel.ERROR);
        }
        
        return false;
    }

    async _requestCredentials() {
        const response = await new Promise((resolve) => {
            this.emit('needCredentials', {
                message: "Steam login required:",
                callback: resolve
            });
        });
        
        return {
            accountName: response.username,
            password: response.password,
            machineName: PROGRAM_NAME
        };
    }

    _setupEventListeners() {

        // --- Pre-logon ---
        this.user.on('steamGuard', async (dom, cb, re) => this._handleSteamGuard(dom, cb, re));

        // --- Post-logon ---
        this.user.on('loggedOn', () => {
            this._log("Logged into Steam! Connecting to TF2 GC...");
            this.user.setPersona(SteamUser.EPersonaState.Invisible); // Maybe let user choose Online vs Invis in config
            this.user.gamesPlayed([440]); // "Start" TF2
        });

        this.user.on('accountInfo', (name) => {
            this._log(`You are logged in as: ${name}`);
        });

        this.user.on('refreshToken', async (rt) => this._handleRefreshToken(rt));
    
        // --- TF2 Loaded ---
        this.tf2.on('connectedToGC', () => {
            this._log("Connected to TF2 Game Coordinator!");
        });
    
        // --- Backpack loaded (final stage) ---
        let firstLoad = true;
        this.tf2.on('backpackLoaded', async () => {
            if (firstLoad) {
                firstLoad = false;
                this._log(`Inventory loaded: ${this.tf2.backpack.length} items found.`);

                // TEST FOR EXAMPLE OF ITEM OBJECT
                this._log(JSON.stringify(this.tf2.backpack[0]), LogLevel.DEBUG);
                this._log(JSON.stringify(this.itemSheet[this.tf2.backpack[0].def_index]), LogLevel.DEBUG);
                
                this.emit('ready');
            } else {
                this._log("Inventory was just reloaded.");
            }
        });
    
        // --- Errors ---
        this.user.on('error', async (err) => this._handleUserInitError(err));
        this.user.on('disconnected', (eresult, msg) => {
            this._log(`Steam connection lost: ${msg} (${eresult}). Reconnecting...`, LogLevel.WARN);
        });
    }

    async _handleSteamGuard(domain, callback, lastCodeWrong) {
        if (lastCodeWrong) {
            this._log("Last code was incorrect! Please try again.", LogLevel.WARN);
        }
        
        const isEmail = !!domain;
        const codeOrigin = isEmail ? `Email (${domain})` : 'Mobile App';
        const response = await new Promise((resolve) => {
            this.emit('inputRequired', {
                message: `Steam Guard Code (${codeOrigin}):`,
                callback: resolve
            });
        });

        if (response == null) {
            this._log("Auth cancelled. Exiting...");
            process.exit(0);
        }
        
        callback(response.trim());
        
    }

    // Save refreshToken to file
    async _handleRefreshToken(refreshToken) {
        this._log("Refresh token generated, saving...");

        // If Steam ID not loaded yet
        if (!this.user.steamID) {
            await new Promise( (resolve) => this.user.once('loggedOn', resolve) );
        }
        
        const data = {
            token: refreshToken,
            timestamp: Date.now(),
            account: this.user.steamID ? this.user.steamID.getSteamID64() : 'unknown'
        };
        
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(data, null, 4), 'utf8');
    }

    async _handleUserInitError(err) {
        this._log(`Steam Login Error: ${err.message}`);
        
        if (err.eresult === SteamUser.EResult.InvalidPassword) {
            this._log("Session invalid. Deleting saved token...");
            if (fs.existsSync(TOKEN_PATH)) fs.unlinkSync(TOKEN_PATH);
            await this._logon() // Retry login
        } else {
            // Fatal?
            process.exit(1);
        }
    }

    // --- Logging and input ---
    
    _log(msg, lvl = LogLevel.INFO) {
        this.emit('log', { message: msg, level: lvl, timestamp: Date.now() });
    }
    
    async _requestUserInput(promptMessage) {
        return new Promise((resolve) => {
            this.emit('inputRequired', {
                message: promptMessage,
                callback: resolve
            });
        });
    }
    
}

module.exports = TF2Engine;
