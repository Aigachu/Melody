"use strict";
/**
 * Project Lavenza
 * Copyright 2017-2018 Aigachu, All Rights Reserved
 *
 * License: https://github.com/Aigachu/Lavenza-II/blob/master/LICENSE
 *
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
const arp = require("app-root-path");
const prompt = require("prompt-async");
// Imports.
const Gestalt_1 = require("../Gestalt/Gestalt");
const TalentManager_1 = require("../Talent/TalentManager");
const BotManager_1 = require("../Bot/BotManager");
const Akechi_1 = require("../Confidant/Akechi");
const Morgana_1 = require("../Confidant/Morgana");
const Makoto_1 = require("../Confidant/Makoto");
const Sojiro_1 = require("../Confidant/Sojiro");
const Igor_1 = require("../Confidant/Igor");
const Yoshida_1 = require("../Confidant/Yoshida");
/**
 * Provides class for the Core of the Lavenza application.
 *
 * Most of the Core business and bootstrapping happens here, though specified features will be
 * properly divided into respective classes. We're going for full-blown OOP here.
 * Let's try to make, and KEEP, this clean now!
 *
 * Lavenza hates dirty code. ;)
 */
class Core {
    /**
     * This is a static class. The constructor will never be used.
     */
    constructor() {
    }
    /**
     * Initialize Lavenza's configurations with the specified path.
     *
     * With the provided path, we will tell the rest of the code where to look for important files. Projects that
     * inherit Lavenza will need to create relevant files that are needed to use the framework.
     *
     * @param rootPath
     *   Path to the directory where Lavenza files are stored.
     */
    static initialize(rootPath) {
        return __awaiter(this, void 0, void 0, function* () {
            // Some flavor text for the console.
            yield Morgana_1.default.warn(`Initializing (v${Core.version})...`);
            // So first, we want to check if the provided path exists.
            // We're already going to start making use of our Confidants here! Woo!
            if (!(yield Akechi_1.default.isDirectory(rootPath))) {
                yield Morgana_1.default.warn(`The Desk path provided in the initialize() function (${rootPath}) doesn't lead to a valid directory.`);
                // Start a prompt to see if user would like to generate a basic Desk.
                yield Morgana_1.default.warn(`Would you like to generate a basic Desk at this path?`);
                yield prompt.start();
                const { confirmation } = yield prompt.get({
                    properties: {
                        confirmation: {
                            description: 'Yes or no (Y/N)',
                            type: 'string',
                            default: 'y',
                        }
                    }
                });
                // If they agree, copy the basic desk to their desired location.
                if (confirmation.startsWith('y')) {
                    yield Akechi_1.default.copyFiles(arp.path, rootPath);
                    yield Morgana_1.default.success(`A Desk structure has been generated at the provided path. You may configure it and try running Lavenza again!`);
                }
                yield Morgana_1.default.error('Until a Desk is properly configured, Lavenza will not run. Please refer to the guides in the README to configure the Desk.');
                process.exit(1);
            }
            // Using the provided path, we set the relevant paths to the Core.
            yield Core.setPaths(rootPath);
            // Initialize Yoshida's translation options since we'll be using them throughout the application.
            yield Yoshida_1.default.initializeI18N();
            // We'll read the settings file if it exists and load settings into our class.
            let pathToSettings = Core.paths.root + '/settings.yml';
            if (!Akechi_1.default.fileExists(pathToSettings)) {
                yield Morgana_1.default.error(`The settings.yml file does not seem to exist in ${pathToSettings}. Please create this file using the example file found at the same location.`);
                process.exit(1);
            }
            // Set settings values to the class.
            Core.settings = yield Akechi_1.default.readYamlFile(pathToSettings);
            // If a master isn't set, we shouldn't continue. A master bot must set.
            if (Sojiro_1.default.isEmpty(Core.settings.master)) {
                yield Morgana_1.default.error(`There is no master bot set in your settings.yml file. A master bot must be set so the application knows which bot manages everythingx. Refer to the settings.example.yml file for more details.`);
                process.exit(1);
            }
            // Return the core so we can chain functions.
            return Core;
        });
    }
    /**
     * Setup paths and assign them to the Core.
     *
     * @param rootPath
     *   The provided root path to base ourselves on.
     */
    static setPaths(rootPath) {
        return __awaiter(this, void 0, void 0, function* () {
            Core.paths = {
                root: rootPath,
                bots: rootPath + '/bots',
                talents: {
                    core: arp.path + '/core/talents',
                    custom: rootPath + '/talents'
                },
                database: rootPath + '/database'
            };
        });
    }
    /**
     * PERSONA!
     *
     * This function starts the application. It runs all of the preparations, then runs the application afterwards.
     *
     * All tasks done in the PREPARATION phase are in the build() function.
     *
     * All tasks done in the EXECUTION phase are in the run() function.
     */
    static summon() {
        return __awaiter(this, void 0, void 0, function* () {
            // If settings aren't set, it means that initialization was bypassed. We can't allow that.
            if (Sojiro_1.default.isEmpty(Core.settings)) {
                return;
            }
            /*
             * Fire necessary preparations.
             * The application can end here if we hit an error in the build() function.
             */
            yield Core.build().catch(Igor_1.default.stop);
            /*
             * If preparations go through without problems, go for run tasks.
             * Run tasks should be done only after all prep is complete.
             */
            yield Core.run().catch(Igor_1.default.stop);
        });
    }
    /**
     * Run all build tasks.
     *
     * This involves reading and parsing bot files, talent files and command files. Database preparations and instances
     * are also prepared here.
     */
    static build() {
        return __awaiter(this, void 0, void 0, function* () {
            // Some more flavor text.
            yield Morgana_1.default.status("Commencing preparatory tasks!");
            /*
             * Run build handler for the Gestalt service.
             * We need to set up the database first and foremost.
             */
            yield Gestalt_1.default.build();
            /**
             * Run build functions for the Talent Manager.
             * This will load all talents from the 'talents' folder and prepare them accordingly.
             */
            yield TalentManager_1.default.build();
            /**
             * Run build functions for the Bot Manager.
             * This will load all bots and prepare their data before they connect to their clients.
             * Each bot may undergo tasks specific to Talents they have.
             */
            yield BotManager_1.default.build();
            /*
             * Run bootstrap handler for Gestalt.
             * Creates & verifies database tables/files.
             */
            yield Gestalt_1.default.bootstrap();
            /*
             * Await Makoto's Preparation.
             * Makoto is the cooldown manager. She needs to be initialized here.
             * No announcements needed for this. She can prepare quietly.
             * @TODO - Manage this elsewhere...She shouldn't have to be initiated here honestly.
             */
            yield Makoto_1.default.build();
            // Some more flavor.
            yield Morgana_1.default.success("Preparations complete.");
        });
    }
    /**
     * Application Run phase.
     *
     * All execution tasks are ran here.
     */
    static run() {
        return __awaiter(this, void 0, void 0, function* () {
            // Some more flavor.
            yield Morgana_1.default.status("Commencing execution phase!");
            // Deploy bots from the BotManager.
            // All bots set to run will be online after this executes.
            yield BotManager_1.default.run();
        });
    }
}
exports.default = Core;
/**
 * Stores Lavenza's version.
 * The version number is obtained from the 'package.json' file at the root of the project.
 */
Core.version = require(arp.path + '/package').version;