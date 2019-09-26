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
const Sojiro_1 = require("../../../Confidant/Sojiro");
const Makoto_1 = require("../../../Confidant/Makoto");
const Morgana_1 = require("../../../Confidant/Morgana");
const Igor_1 = require("../../../Confidant/Igor");
const Eminence_1 = require("../../Eminence/Eminence");
/**
 * Provides a base class for Command Authorizers.
 *
 * This class will handle the authorization of an already determined order.
 */
class CommandAuthorizer {
    /**
     * Command Authorizers are not static since multiple commands can come in at once, and we wouldn't want conflicts.
     *
     * Constructor actions are here.
     *
     * @TODO - Holy shit...We need to make sure a prompt isn't in progress my guy. LOL.
     *
     * @param resonance
     *   The resonance that we are trying to locate a command in.
     * @param command
     *   The command that was found in the Resonance.
     */
    constructor(resonance, command) {
        /**
         * Object to store relevant configurations.
         */
        this.configurations = {};
        this.resonance = resonance;
        this.bot = resonance.bot;
        this.type = resonance.client.type;
        this.command = command;
    }
    /**
     * Perform async operations that occur right after building an Authorizer.
     */
    build(resonance) {
        return __awaiter(this, void 0, void 0, function* () {
            // Set the identity of the author.
            // Depending on the type of client we're in, this will be set differently.
            this.authorID = yield this.getAuthorIdentification();
            // We build all the configurations we'll need to make our authority checks.
            // Bot Configurations.
            this.configurations.bot = {
                base: yield this.bot.getActiveConfig(),
                client: yield this.bot.getActiveClientConfig(this.type),
            };
            // Command Configurations.
            this.configurations.command = {
                base: yield this.command.getActiveConfigForBot(this.bot),
                client: yield this.command.getActiveClientConfig(this.type, this.bot),
                parameters: yield this.command.getParameterConfig(),
            };
            // Client configurations.
            this.configurations.client = yield this.resonance.client.getActiveConfigurations();
        });
    }
    /**
     * The authority function. This function will return TRUE if the order is authorized, and FALSE otherwise.
     *
     * This is a default implementation of the method. Authorizers should be created per client, and each client
     * authorizes commands in their own way through their respective Authorizers. They will however each call this
     * default authorize function first.
     *
     * @returns
     *   Returns true if the order is authorized. False otherwise.
     */
    authorize() {
        return __awaiter(this, void 0, void 0, function* () {
            // Now we'll check if the person that invoked the command is the Joker.
            // If so, no access checks are needed.
            // @TODO - Masquerade would be nice to facilitate testing purposes!
            if (this.authorID == this.resonance.bot.joker[this.resonance.client.type].id) {
                return true;
            }
            // Check if user is allowed to use this command.
            let activationValidation = yield this.validateActivation();
            if (!activationValidation) {
                yield Morgana_1.Morgana.warn('command activation failed');
                return false;
            }
            // Validate that the command isn't on cooldown.
            // Check if cooldowns are on for this command.
            // If so, we have to return.
            let commandIsOnCooldown = yield this.commandIsOnCooldown();
            if (commandIsOnCooldown) {
                // Send the cooldown notification.
                yield this.sendCooldownNotification();
                return false;
            }
            // At this point, if the configuration is empty, we have no checks to make, so we let it pass.
            if (Sojiro_1.Sojiro.isEmpty(this.configurations.command.client)) {
                // await Lavenza.warn('No configurations were found for this command...Is this normal?...');
                return true;
            }
            // Check if the privacy is good here. Some commands can't be used in direct messages.
            let privacyValidation = yield this.validatePrivacy();
            if (!privacyValidation) {
                yield Morgana_1.Morgana.warn('privacy validation failed');
                return false;
            }
            // Check if user is allowed to use this command.
            let userValidation = yield this.validateUser();
            if (!userValidation) {
                yield Morgana_1.Morgana.warn('user validation failed');
                return false;
            }
            // Check if the user has the necessary eminence to execute the command.
            let eminenceValidation = yield this.validateEminence();
            if (!eminenceValidation) {
                yield Morgana_1.Morgana.warn('eminence validation failed');
                return false;
            }
            // If command arguments aren't valid, we hit the message with a reply explaining the error, and then end.
            let argumentsValidation = yield this.validateCommandArguments();
            if (!argumentsValidation) {
                yield Morgana_1.Morgana.warn('arguments validation failed');
                return false;
            }
            // Now, well execute the warrant() function, which does checks specific to the client.
            let clientWarrant = yield this.warrant();
            // noinspection RedundantIfStatementJS
            if (!clientWarrant) {
                yield Morgana_1.Morgana.warn('client warrant validation failed');
                return false;
            }
            return true;
        });
    }
    /**
     * Validates whether or not the command is activated.
     *
     * It also checks whitelisting capabilities.
     *
     * @returns
     *   TRUE if this authorization passes, FALSE otherwise.
     */
    validateActivation() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configurations.command.base.active === undefined || this.configurations.command.base.active) {
                return true;
            }
        });
    }
    /**
     * If the resonance was received from a private message, we check if this command can be used in that context.
     *
     * @returns
     *   TRUE if this authorization passes, FALSE otherwise.
     */
    validatePrivacy() {
        return __awaiter(this, void 0, void 0, function* () {
            // Get the privacy of the resonance.
            let messageIsPrivate = yield this.resonance.isPrivate();
            // If the message if not private, we have no checks to make.
            if (!messageIsPrivate) {
                return true;
            }
            // Set it to true by default.
            let allowedInPrivate = true;
            // At this point we know the message is private. We return whether or not it's allowed.
            // Get the base command configuration.
            if (this.configurations.command.base.authorization && this.configurations.command.base.authorization.hasOwnProperty('enabledInDirectMessages')) {
                allowedInPrivate = this.configurations.command.base.authorization.enabledInDirectMessages;
            }
            // If the client configuration has an override, we'll use it.
            if (this.configurations.command.base.authorization && this.configurations.command.client.authorization.hasOwnProperty('enabledInDirectMessages')) {
                allowedInPrivate = this.configurations.command.client.authorization.enabledInDirectMessages;
            }
            return allowedInPrivate;
        });
    }
    /**
     * Validate that the user is not blacklisted.
     *
     * @returns
     *   TRUE if this authorization passes, FALSE otherwise.
     */
    validateUser() {
        return __awaiter(this, void 0, void 0, function* () {
            if (Sojiro_1.Sojiro.isEmpty(this.configurations.command.client.authorization.blacklist.users)) {
                return true;
            }
            return !this.configurations.command.client.authorization.blacklist.users.includes(this.authorID);
        });
    }
    /**
     * Validates that the user has the appropriate role needed to run this command.
     *
     * @returns
     *   TRUE if this authorization passes, FALSE otherwise.
     */
    validateEminence(requiredEminence = undefined) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get the role of the author of the message.
            let authorEminence = yield this.getAuthorEminence();
            // If an eminence is provided in the arguments, we validate that the user has the provided eminence (or above).
            if (requiredEminence) {
                return authorEminence >= Eminence_1.Eminence[requiredEminence];
            }
            // Set the required Eminence by default to None.
            requiredEminence = Eminence_1.Eminence.None;
            // Attempt to get configuration set in the base command configuration.
            if (this.configurations.command.base.authorization && this.configurations.command.base.authorization.hasOwnProperty('accessEminence')) {
                requiredEminence = Eminence_1.Eminence[this.configurations.command.base.authorization.accessEminence];
            }
            // Attempt to get configuration set in the client command configuration.
            if (this.configurations.command.client.authorization && this.configurations.command.client.authorization.hasOwnProperty('accessEminence')) {
                requiredEminence = Eminence_1.Eminence[this.configurations.command.client.authorization.accessEminence];
            }
            // Then we just make sure that the author's ID can be found where it's needed.
            return authorEminence >= requiredEminence;
        });
    }
    /**
     * Validate command arguments if we need to.
     *
     * This simply checks if the command has input. When it comes to options or flags in commands, specific checks
     * must be performed per client authorizer, since each client has a different way to manage authority.
     *
     * @returns
     *   Returns true if the arguments are valid. False otherwise.
     */
    validateCommandArguments() {
        return __awaiter(this, void 0, void 0, function* () {
            // Get the arguments we need.
            let args = yield this.resonance.getArguments();
            // If there are no arguments, we have nothing to validate.
            if (Sojiro_1.Sojiro.isEmpty(args['_']) && args.length === 1) {
                return true;
            }
            // First, we perform input validations.
            if (this.configurations.command.parameters.input) {
                if (this.configurations.command.parameters.input.required === true && Sojiro_1.Sojiro.isEmpty(args['_'])) {
                    return false;
                }
            }
            // We'll merge the options and flags together for easier comparisons.
            let configOptions = this.configurations.command.parameters.options || [];
            let configFlags = this.configurations.command.parameters.flags || [];
            let configArgs = [...configOptions, ...configFlags];
            // If args is empty, we don't have any validations to do.
            if (Sojiro_1.Sojiro.isEmpty(configArgs)) {
                return true;
            }
            // If any arguments were given, we'll validate them here.
            let validations = yield Promise.all(Object.keys(args).map((arg) => __awaiter(this, void 0, void 0, function* () {
                // If there are no arguments, we don't need to validate anything.
                if (arg === '_') {
                    return true;
                }
                // Attempt to find the argument in the configurations.
                let argConfig = configArgs.find(configArg => configArg.key === arg || configArg['aliases'] !== undefined && configArg['aliases'].includes(arg));
                // If this argument is not in the configuration, then it's an invalid argument.
                if (Sojiro_1.Sojiro.isEmpty(argConfig)) {
                    yield Igor_1.Igor.throw(`{{arg}} is not a valid argument for this command.`, { arg: arg });
                }
                // Next we validate that the user has the appropriate eminence to use the argument.
                let validateAccessEminence = yield this.validateEminence(Eminence_1.Eminence[argConfig.accessEminence]);
                if (!validateAccessEminence) {
                    yield Igor_1.Igor.throw(`You do not have the necessary permissions to use the {{arg}} argument. Sorry. You may want to talk to Aiga about getting permission!`, { arg: argConfig.key });
                }
                return true;
            }))).catch(error => {
                console.error(error);
                return false;
            });
            // Get out if it failed.
            if (!validations) {
                return false;
            }
            // If all checks pass, we can return true.
            return true;
        });
    }
    /**
     * Validates that the command is not on cooldown.
     *
     * If it is, we notify the user.
     *
     * @returns
     *   Returns true if the command is on cooldown. False otherwise.
     */
    commandIsOnCooldown() {
        return __awaiter(this, void 0, void 0, function* () {
            // @TODO - If the invoker is an architect or deity, they shouldn't be affected by cooldowns.
            // Using the cooldown manager, we check if the command is on cooldown first.
            // Cooldowns are individual per user. So if a user uses a command, it's not on cooldown for everyone.
            if (Makoto_1.Makoto.check(this.bot.id, 'command', this.command.key, 0)) {
                return true;
            }
            // noinspection RedundantIfStatementJS
            if (Makoto_1.Makoto.check(this.bot.id, 'command', this.command.key, this.resonance.author.id)) {
                return true;
            }
            return false;
        });
    }
    /**
     * Puts the command on cooldown using Makoto.
     */
    activateCooldownForCommand() {
        return __awaiter(this, void 0, void 0, function* () {
            // Cools the command globally after usage.
            if (this.configurations.command.base.cooldown.global !== 0) {
                Makoto_1.Makoto.set(this.bot.id, 'command', this.command.key, 0, this.configurations.command.base.cooldown.global * 1000).then(() => {
                    // Do nothing.
                });
            }
            // Cools the command after usage for the user.
            if (this.configurations.command.base.cooldown.user !== 0) {
                Makoto_1.Makoto.set(this.bot.id, 'command', this.command.key, this.resonance.author.id, this.configurations.command.base.cooldown.user * 1000).then(() => {
                    // Do nothing.
                });
            }
        });
    }
}
exports.CommandAuthorizer = CommandAuthorizer;
