"use strict";
/**
 * Project Lavenza
 * Copyright 2017-2018 Aigachu, All Rights Reserved
 *
 * License: https://github.com/Aigachu/Lavenza-II/blob/master/LICENSE
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// Modules.
const DotEnv = require("dotenv");
// Imports.
const Akechi_1 = require("../Confidant/Akechi");
const Igor_1 = require("../Confidant/Igor");
const Morgana_1 = require("../Confidant/Morgana");
const Sojiro_1 = require("../Confidant/Sojiro");
const Gestalt_1 = require("../Gestalt/Gestalt");
const TalentManager_1 = require("../Talent/TalentManager");
const ClientFactory_1 = require("./Client/ClientFactory");
const ClientType_1 = require("./Client/ClientType");
const CommandListener_1 = require("./Command/CommandListener/CommandListener");
/**
 * Provides a class for Bots.
 *
 * Bots are the fruit of this application. They're the whole point of it. And this is where it all happens!
 *
 * Configuration for bots are managed in a 'config.yml' file found in their folder. From there, functions in here
 * manage the authentication to the bot's clients and what talents the bot has.
 */
class Bot {
    /**
     * Bot constructor.
     *
     * @param id
     *   id of the bot. This is the name of the folder, not a reader-friendly name.
     * @param config
     *   Configuration loaded from the bot's 'NAME.config.yml' file.
     * @param directory
     *   Path to the directory where this bot's files are stored.
     */
    constructor(id, config, directory) {
        /**
         * Object to store list of Clients the bot has.
         */
        this.clients = {};
        /**
         * Stores a list of all talents associated with a bot, through their ID.
         */
        this.talents = [];
        /**
         * Object to store the list of commands available in the bot.
         */
        this.commands = {};
        /**
         * Object to store the list of all command aliases available in this bot.
         */
        this.commandAliases = {};
        /**
         * Array to store a list of all Listeners attached to this bot.
         */
        this.listeners = [];
        /**
         * Array to store a list of all Listeners attached to this bot.
         */
        this.prompts = [];
        /**
         * Object to store data about the bot's master user.
         */
        this.joker = {};
        /**
         * Boolean to determine whether the bot is set to maintenance mode or not.
         */
        this.maintenance = false;
        /**
         * Boolean to determine if the bot is the Master Bot. There can only be one!
         */
        this.isMaster = false;
        /**
         * Boolean to store whether or no the bot is summoned.
         */
        this.summoned = false;
        this.id = id;
        this.config = config;
        this.directory = directory;
    }
    /**
     * The Gestalt function is used to setup database tables for a given object.
     *
     * In this case, these are the database setup tasks for Bots.
     *
     * You can see the result of these calls in the database.
     */
    gestalt() {
        return __awaiter(this, void 0, void 0, function* () {
            // Initialize the database collection for this bot if it doesn't already exist.
            yield Gestalt_1.Gestalt.createCollection(`/bots/${this.id}`);
            // Initialize the database collection for this bot's configurations if it doesn't already exist.
            yield Gestalt_1.Gestalt.createCollection(`/bots/${this.id}/config`);
            // Sync core bot config to the database.
            yield Gestalt_1.Gestalt.sync(this.config, `/bots/${this.id}/config/core`);
            // Initialize i18n database collection for this bot if it doesn't already exist.
            yield Gestalt_1.Gestalt.createCollection(`/i18n/${this.id}`);
            // Initialize i18n database collection for this bot's clients configurations if it doesn't already exist.
            yield Gestalt_1.Gestalt.createCollection(`/i18n/${this.id}/clients`);
            // Create a database collection for the talents granted to a bot.
            yield Gestalt_1.Gestalt.createCollection(`/bots/${this.id}/talents`);
            // Await the bootstrapping of each talent's data.
            yield Promise.all(this.talents.map((talentKey) => __awaiter(this, void 0, void 0, function* () {
                // Load Talent from the TalentManager.
                const talent = yield TalentManager_1.TalentManager.getTalent(talentKey);
                // Create a database collection for the talents granted to a Bot.
                yield Gestalt_1.Gestalt.createCollection(`/bots/${this.id}/talents/${talent.machineName}`);
                // Await the synchronization of data between the Talent's default configuration and the database configuration.
                yield Gestalt_1.Gestalt.sync(talent.config, `/bots/${this.id}/talents/${talent.machineName}/config`);
            })));
            // Create a database collection for Commands belonging to a Bot.
            yield Gestalt_1.Gestalt.createCollection(`/bots/${this.id}/commands`);
            // Await the bootstrapping of Commands data.
            yield Promise.all(Object.keys(this.commands)
                .map((commandKey) => __awaiter(this, void 0, void 0, function* () {
                // Load Command from the Bot.
                const command = yield this.getCommand(commandKey);
                // Create a database collection for commands belonging to a Bot.
                yield Gestalt_1.Gestalt.createCollection(`/bots/${this.id}/commands/${command.id}`);
                // Synchronization of data between the Command's default configuration and the database configuration.
                yield Gestalt_1.Gestalt.sync(command.config, `/bots/${this.id}/commands/${command.id}/config`);
            })));
            // Create a database collection for the clients belonging to a Bot.
            yield Gestalt_1.Gestalt.createCollection(`/bots/${this.id}/clients`);
        });
    }
    /**
     * Deployment handler for this Bot.
     *
     * Authenticates the clients and initializes talents.
     */
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            // If the bot is already summoned, we don't want to do anything here.
            if (this.summoned) {
                yield Morgana_1.Morgana.warn("Tried to deploy {{bot}}, but the bot is already summoned!", { bot: this.id });
                return;
            }
            // Await client initialization.
            yield this.initializeClients();
            // Await clients authentication.
            yield this.authenticateClients();
            // Await building of architect.
            yield this.setJoker();
            // Await talent initializations for this bot.
            // We do this AFTER authenticating clients. Some talents might need client info to perform their initializations.
            yield this.initializeTalentsForBot();
            // Set the bot's summoned flag to true.
            this.summoned = true;
        });
    }
    /**
     * Shutdown the bot, disconnecting it from all clients.
     */
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            // If the bot isn't summoned, we can't shut it down.
            if (!this.summoned) {
                yield Morgana_1.Morgana.warn("Tried to shutdown {{bot}}, but it's already disconnected!", { bot: this.id });
                return;
            }
            // Disconnect the bot from all clients.
            yield this.disconnectClients();
            // Set the bot's summoned flag to true.
            this.summoned = false;
        });
    }
    /**
     * Preparation handler for the Bot.
     *
     * Initializes clients, talents, commands and listeners.
     */
    prepare() {
        return __awaiter(this, void 0, void 0, function* () {
            // Load environment variables.
            yield this.loadEnvironmentVariables();
            // Talent grants.
            yield this.grantTalents();
            // Command inheritance.
            yield this.setCommands();
            // Listener initialization & inheritance.
            yield this.setListeners();
        });
    }
    /**
     * Get the active configuration from the database for this Bot.
     *
     * @returns
     *   Returns the configuration fetched from the database.
     */
    getActiveConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            // Attempt to get the active configuration from the database.
            const activeConfig = yield Gestalt_1.Gestalt.get(`/bots/${this.id}/config/core`);
            if (!Sojiro_1.Sojiro.isEmpty(activeConfig)) {
                return activeConfig;
            }
            // Sync it to the database.
            yield Gestalt_1.Gestalt.sync(this.config, `/bots/${this.id}/config/core`);
            // Return the configuration.
            return this.config;
        });
    }
    /**
     * Retrieve a specific client from a Bot.
     *
     * @param clientType
     *   The type of client to return from the bot.
     *
     * @returns
     *   The requested client.
     */
    getClient(clientType) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.clients[clientType];
        });
    }
    /**
     * Retrieve configuration for a specific client in a bot.
     *
     * @param clientType
     *   The type of client configuration to return for the bot.
     *
     * @returns
     *   The requested client configuration from the base files.
     */
    getClientConfig(clientType) {
        return __awaiter(this, void 0, void 0, function* () {
            // Determine path to client configuration.
            const pathToClientConfig = `${this.directory}/${clientType}.yml`;
            // Attempt to fetch client configuration.
            if (!(yield Akechi_1.Akechi.fileExists(pathToClientConfig))) {
                return undefined;
            }
            // Load configuration since it exists.
            return yield Akechi_1.Akechi.readYamlFile(pathToClientConfig);
        });
    }
    /**
     * Retrieve active client configuration for this bot.
     *
     * @param clientType
     *   The type of client configuration to return for the bot.
     *
     * @returns
     *   The requested client configuration straight from the database.
     */
    getActiveClientConfig(clientType) {
        return __awaiter(this, void 0, void 0, function* () {
            // Attempt to get the active configuration from the database.
            const activeConfig = yield Gestalt_1.Gestalt.get(`/bots/${this.id}/config/${clientType}`);
            if (!Sojiro_1.Sojiro.isEmpty(activeConfig)) {
                return activeConfig;
            }
            // If we don't find any configurations in the database, we'll fetch it normally and then save it.
            const config = yield this.getClientConfig(clientType);
            // Sync it to the database.
            yield Gestalt_1.Gestalt.sync(config, `/bots/${this.id}/config/${clientType}`);
            // Return the configuration.
            return config;
        });
    }
    /**
     * Attempt to get a command from the list of commands in this Bot.
     *
     * @param commandKey
     *   The key of the command to search for.
     *
     * @returns
     *   The command object given the key provided.
     */
    getCommand(commandKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Sojiro_1.Sojiro.isEmpty(this.commandAliases[commandKey])) {
                return this.commands[this.commandAliases[commandKey]];
            }
            return this.commands[commandKey];
        });
    }
    /**
     * Remove a prompt from the current bot.
     *
     * @param prompt
     *   The prompt to remove from this bot.
     */
    removePrompt(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            this.prompts = Sojiro_1.Sojiro.removeFromArray(this.prompts, prompt);
        });
    }
    /**
     * Disconnect all of the clients in this bot.
     */
    disconnectClients() {
        return __awaiter(this, void 0, void 0, function* () {
            // Await the authentication of the clients linked to the bot.
            yield Promise.all(Object.keys(this.clients)
                .map((clientType) => __awaiter(this, void 0, void 0, function* () {
                // Await authentication of the bot.
                yield this.disconnectClient(clientType);
            })));
        });
    }
    /**
     * Disconnect from a determined client on this bot.
     *
     * @param clientType
     *   The client ID to disconnect from.
     */
    disconnectClient(clientType) {
        return __awaiter(this, void 0, void 0, function* () {
            // Simply call the client's disconnect function.
            const client = yield this.getClient(clientType);
            yield client.disconnect();
        });
    }
    /**
     * Get the command prefix, after a couple of checks.
     *
     * @param resonance
     *   The Resonance we're taking a look at.
     *
     * @returns
     *   Returns the command prefix we need to check for.
     */
    getCommandPrefix(resonance) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get the configuration.
            const botConfig = yield this.getActiveConfig();
            // Get bot's client configuration.
            const botClientConfig = yield this.getClientConfig(resonance.client.type);
            // Variable to store retrieved command prefix.
            // Using the client, fetch appropriate command prefix configured in a client.
            let commandprefix = (yield resonance.client.getCommandPrefix(resonance)) || undefined;
            // Reset it to undefined if it's empty.
            if (Sojiro_1.Sojiro.isEmpty(commandprefix)) {
                commandprefix = undefined;
            }
            // By default, return the following.
            return commandprefix || botClientConfig.commandPrefix || botConfig.commandPrefix;
        });
    }
    /**
     * Load the .env file specific to this bot, and parse its contents.
     */
    loadEnvironmentVariables() {
        return __awaiter(this, void 0, void 0, function* () {
            const envFileData = yield Akechi_1.Akechi.readFile(`${this.directory}/.env`);
            this.env = DotEnv.parse(envFileData);
        });
    }
    /**
     * For each client, we build Joker's identification and data.
     *
     * We should be able to access Joker's information from the bot at all times.
     */
    setJoker() {
        return __awaiter(this, void 0, void 0, function* () {
            // Await processing of all clients.
            // @TODO - Factory Design Pattern for these.
            yield Promise.all(Object.keys(this.clients)
                .map((clientKey) => __awaiter(this, void 0, void 0, function* () {
                const config = yield this.getActiveClientConfig(ClientType_1.ClientType.Discord);
                const client = yield this.getClient(clientKey);
                this.joker[clientKey] = yield client.getUser(config.joker);
            })));
        });
    }
    /**
     * Set all necessary commands to the Bot.
     *
     * Bots inherit their commands from Talents. Here we set all commands that are already loading into talents, into
     * the bots.
     *
     * By the time this function runs, the Bot should already have all of its necessary talents granted.
     */
    setCommands() {
        return __awaiter(this, void 0, void 0, function* () {
            // Await the processing of all talents loaded in the bot.
            yield Promise.all(this.talents.map((talentMachineName) => __awaiter(this, void 0, void 0, function* () {
                // We'll fetch the talent.
                const talent = yield TalentManager_1.TalentManager.getTalent(talentMachineName);
                // First we attempt to see if there is intersection going on with the commands.
                // This will happen if there are multiple instances of the same commands (or aliases).
                // The bot will still work, but one command will effectively override the other. Since this information is only
                // Important for developers, we should just throw a warning if this happens.
                const commandsIntersection = Object.keys(this.commands)
                    .filter({}.hasOwnProperty.bind(talent.commands));
                const aliasesIntersection = Object.keys(this.commandAliases)
                    .filter({}.hasOwnProperty.bind(talent.commandAliases));
                if (!Sojiro_1.Sojiro.isEmpty(commandsIntersection)) {
                    yield Morgana_1.Morgana.warn("There seems to be duplicate commands in {{bot}}'s code: {{intersect}}. This can cause unwanted overrides. Try to adjust the command keys to fix this. A workaround will be developed in the future.", {
                        bot: this.id,
                        intersect: JSON.stringify(commandsIntersection),
                    });
                }
                if (!Sojiro_1.Sojiro.isEmpty(aliasesIntersection)) {
                    yield Morgana_1.Morgana.warn("There seems to be duplicate command aliases in {{bot}}'s code: {{intersect}}. This can cause unwanted overrides. Try to adjust the command keys to fix this. A workaround will be developed in the future.", {
                        bot: this.id,
                        intersect: JSON.stringify(commandsIntersection),
                    });
                }
                // Merge the bot's commands with the Talent's commands.
                this.commands = Object.assign(Object.assign({}, this.commands), talent.commands);
                this.commandAliases = Object.assign(Object.assign({}, this.commandAliases), talent.commandAliases);
            })));
        });
    }
    /**
     * Set all necessary listeners to the Bot.
     *
     * Bots inherit listeners from Talents. Here we set all commands that are already loading into talents, into
     * the bots.
     *
     * By the time this function runs, the Bot should already have all of its necessary talents granted.
     */
    setListeners() {
        return __awaiter(this, void 0, void 0, function* () {
            // Set the core CommandListener.
            this.listeners.push(new CommandListener_1.CommandListener());
            // Await the processing of all talents loaded in the bot.
            yield Promise.all(this.talents.map((talentKey) => __awaiter(this, void 0, void 0, function* () {
                // Merge the bot's listeners with the Talent's listeners.
                this.listeners = [...this.listeners, ...TalentManager_1.TalentManager.talents[talentKey].listeners];
            })));
        });
    }
    /**
     * Authenticate all of the clients in this bot.
     */
    authenticateClients() {
        return __awaiter(this, void 0, void 0, function* () {
            // Await the authentication of the clients linked to the bot.
            yield Promise.all(Object.keys(this.clients)
                .map((clientType) => __awaiter(this, void 0, void 0, function* () {
                // Await authentication of the bot.
                const client = yield this.getClient(clientType);
                yield client.authenticate();
                // Run appropriate Gestalt handlers in the clients.
                yield client.gestalt();
            })));
        });
    }
    /**
     * Initialize all clients for this bot.
     *
     * Initialization uses the client configuration to properly create the clients.
     */
    initializeClients() {
        return __awaiter(this, void 0, void 0, function* () {
            // Await the processing and initialization of all clients in the configurations.
            yield Promise.all(this.config.clients.map((clientTypeKey) => __awaiter(this, void 0, void 0, function* () {
                // Load configuration since it exists.
                const clientConfig = yield this.getActiveClientConfig(ClientType_1.ClientType[clientTypeKey]);
                if (Sojiro_1.Sojiro.isEmpty(clientConfig)) {
                    yield Morgana_1.Morgana.warn("Configuration file could not be loaded for the {{client}} client in {{bot}}. This client will not be instantiated." +
                        'To create a configuration file, you can copy the ones found in the "example" bot folder.', {
                        bot: this.id,
                        client: clientTypeKey,
                    });
                    return;
                }
                // Uses the ClientFactory to build the appropriate factory given the type.
                // The client is then set to the bot.
                this.clients[ClientType_1.ClientType[clientTypeKey]] = yield ClientFactory_1.ClientFactory.build(ClientType_1.ClientType[clientTypeKey], clientConfig, this);
            })));
        });
    }
    /**
     * Runs each Talent's initialize() function to run any preparations for the given bot.
     */
    initializeTalentsForBot() {
        return __awaiter(this, void 0, void 0, function* () {
            // Await the processing of all of this bot's talents.
            yield Promise.all(this.talents.map((talentKey) => __awaiter(this, void 0, void 0, function* () {
                // Run this talent's initialize function for this bot.
                const talent = yield TalentManager_1.TalentManager.getTalent(talentKey);
                yield talent.initialize(this);
            })));
        });
    }
    /**
     * Grants talents to the Bot.
     *
     * There is a collection of Core talents that all bots will have.
     *
     * Custom Talents are configured in the Bot's configuration file. You must enter the ID (directory name) of
     * the talent in the bot's config so that it can be loaded here.
     *
     * It's important to note that Talent Classes are never stored in the bot. Only the IDs are stored.
     *
     * Talents will always be accessed through the TalentManager itself.
     */
    grantTalents() {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if there are talents set in configuration.
            if (Sojiro_1.Sojiro.isEmpty(this.config.talents)) {
                yield Morgana_1.Morgana.warn("Talents configuration missing for {{bot}}. The bot will not have any cool features!", { bot: this.id });
                return;
            }
            // Await validation of custom talents configured.
            // This basically checks if the talents entered are valid. Invalid ones are removed from the array.
            yield this.validateTalents();
            // After validations are complete, we merge the core talents defined for the bot, with the custom ones.
            // This completes the list of talents assigned to the bot.
            this.talents = this.config.talents;
        });
    }
    /**
     * Validates the list of custom talents configured in the bot's config file.
     *
     * If a talent is in the list, but does not exist, it will be removed from the configuration list.
     */
    validateTalents() {
        return __awaiter(this, void 0, void 0, function* () {
            // If this is the Master bot, we will grant the Master talent.
            if (this.isMaster && !this.talents.includes("master")) {
                this.config.talents.push("master");
            }
            // Alternatively, we'll do a quick check to see if someone is trying to set the master talent in config.
            // This talent should not be set here, and instead is automatically assigned to the master bot.
            if (this.config.talents.includes("master") && !this.isMaster) {
                this.config.talents = Sojiro_1.Sojiro.removeFromArray(this.config.talents, "master");
            }
            // Await the processing of all talents in the bot's config object.
            yield Promise.all(this.config.talents.map((talentMachineName) => __awaiter(this, void 0, void 0, function* () {
                // Then, we'll check if this talent already exists in the Manager.
                // This happens if another bot already loaded it.
                // If it exists, we're good.
                const talent = yield TalentManager_1.TalentManager.getTalent(talentMachineName);
                if (talent) {
                    // Validate the dependencies for this talent.
                    yield this.validateTalentDependencies(talentMachineName);
                    return;
                }
                // Await the loading of the talent.
                // If it the load fails, we'll remove the talent from the bot's configuration.
                yield TalentManager_1.TalentManager.loadTalent(talentMachineName)
                    .then(() => __awaiter(this, void 0, void 0, function* () {
                    // Validate the dependencies for this talent.
                    yield this.validateTalentDependencies(talentMachineName);
                }))
                    .catch((error) => __awaiter(this, void 0, void 0, function* () {
                    // Disable this talent for this bot.
                    this.config.talents = Sojiro_1.Sojiro.removeFromArray(this.config.talents, talentMachineName);
                    // Send a warning message to the console.
                    yield Morgana_1.Morgana.warn("Error occurred while loading the {{talent}} talent...", { talent: talentMachineName });
                    yield Igor_1.Igor.throw(error);
                }));
            })));
        });
    }
    /**
     * Validate that the bot has dependencies this talent requires.
     *
     * @param talentMachineName
     *   Machine name of the talent to check dependencies for.
     */
    validateTalentDependencies(talentMachineName) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check talent's configuration to see if dependencies are loaded into this bot.
            yield Promise.all(TalentManager_1.TalentManager.talents[talentMachineName].config.dependencies.map((dependency) => __awaiter(this, void 0, void 0, function* () {
                // If the dependency isn't found in this bot's config, we shouldn't load this talent.
                if (!this.config.talents.includes(dependency)) {
                    // Send a warning to the console.
                    yield Morgana_1.Morgana.warn("The '{{talent}}' talent requires the '{{parent}}' talent to exist and to be enabled, but this is not the case. It will not be activated for {{bot}}.", {
                        bot: this.id,
                        parent: dependency,
                        talent: talentMachineName,
                    });
                    // Remove this talent from the bot.
                    this.config.talents = Sojiro_1.Sojiro.removeFromArray(this.config.talents, talentMachineName);
                }
            })));
        });
    }
}
exports.Bot = Bot;
