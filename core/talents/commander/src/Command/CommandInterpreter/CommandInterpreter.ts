/**
 * Project Lavenza
 * Copyright 2017-2019 Aigachu, All Rights Reserved
 *
 * License: https://github.com/Aigachu/Lavenza-II/blob/master/LICENSE
 */

// Modules.
import * as minimist from "minimist";
import { Bot } from "../../../../../lib/Lavenza/Bot/Bot";

// Imports.
import { Morgana } from "../../../../../lib/Lavenza/Confidant/Morgana";
import { Sojiro } from "../../../../../lib/Lavenza/Confidant/Sojiro";
import { Resonance } from "../../../../../lib/Lavenza/Resonance/Resonance";
import { Instruction } from "../../Instruction/Instruction";
import { CommandCatalogue } from "../../Service/CommandCatalogue";
import { Command } from "../Command";

/**
 * Provides an Interpreter for Commands.
 *
 * This class will determine if a command has been heard by the Bot. It takes a resonance and analyzes it accordingly.
 */
export class CommandInterpreter {

  /**
   * Interpret a Resonance, attempting to find a command in the raw content.
   *
   * @param resonance
   *   The Resonance that will be interpreted.
   */
  public static async interpret(resonance: Resonance): Promise<Instruction> {
    // Return the instruction. If no instruction was found, we simply return undefined here.
    return CommandInterpreter.getInstruction(resonance);
  }

  /**
   * Get an Instruction from a message.
   *
   * The checks and analysis will determine if a command exists in the resonance.
   *
   * @param resonance
   *   The resonance received from the listener.
   *
   * @returns
   *   Returns an Instruction will all relevant information about the command in it.
   */
  private static async getInstruction(resonance: Resonance): Promise<Instruction> {
    // Initialize some variables.
    const content = resonance.content;
    const bot = resonance.bot;
    const client = resonance.client;

    // Split content with spaces.
    // I.e. If the input is '! ping hello', then we get ['!', 'ping', 'hello'].
    let splitContent = content.split(" ");

    // Get command prefix.
    // If there is a command prefix override for this client, we will set it. If not, we grab the default.
    const cprefix = await bot.getCommandPrefix(resonance);

    // If the content doesn't start with the command prefix or the bot tag, it's not a command.
    // @todo - In Discord, we want to be able to tag the bot.
    //  Maybe in other clients too. But for now we'll keep it simple.
    if (!splitContent[0].startsWith(cprefix)) {
      return undefined;
    }

    // If he message is entirely just the command prefix, we should return.
    if (content === cprefix) {
      return undefined;
    }

    // At this point we know it's potentially a command. We'll need to find out which command was called.
    // First, we'll format the string accordingly if needed.
    // If a user enters a command attached to the prefix, we separate them here.
    if (splitContent[0].length !== cprefix.length) {
      splitContent = content.replace(cprefix, `${cprefix} `)
        .split(" ");
    }

    // Attempt to fetch the command from the Command Catalogue.
    const command = CommandCatalogue.commands.find((cmd: Command) => cmd.key === splitContent[1].toLowerCase() || cmd.aliases.includes(splitContent[1].toLowerCase()));

    // If the command doesn't exist, we'll stop here.
    if (!command) {
      await Morgana.warn("No command found in message...");

      return undefined;
    }

    // If the command isn't linked to this bot, we'll stop here.
    if (!resonance.bot.commands.includes(command.id)) {
      await Morgana.warn("Command found, but not linked to this bot...");

      return undefined;
    }

    // Now we do one final check to see if this command is allowed to be used in this client.
    // We check the command configuration for this.
    const allowedInClient = await command.allowedInClient(client.type);
    if (!allowedInClient) {
      await Morgana.warn("Command found, but not allowed in client. Returning.");

      return undefined;
    }

    // Next, we'll build the arguments as well, using minimist.
    const args = minimist(splitContent.slice(2));

    // Return our crafted Order.
    return {
      arguments: args,
      command,
      config: {
        base: await command.getActiveConfigForBot(resonance.bot),
        client: await command.getActiveClientConfig(resonance.client.type, resonance.bot),
      },
      content: splitContent.slice(2)
        .join(" "),
    };
  }

  /**
   * Get the command prefix from a resonance, after a couple of checks in the bot that heard the resonance.
   *
   * @param resonance
   *   The Resonance we're taking a look at. We'll look at the information for the given bot to determine the prefix.
   *
   * @returns
   *   Returns the command prefix we need to check for.
   */
  private async getCommandPrefix(resonance: Resonance): Promise<string> {
    // Get the configuration.
    const botConfig = await resonance.bot.config;

    // Get bot's client configuration.
    const botClientConfig = await resonance.bot.getClientConfig(resonance.client.type);

    // Variable to store retrieved command prefix.
    // Using the client, fetch appropriate command prefix configured in a client.
    let commandprefix = await resonance.client.getCommandPrefix(resonance) || undefined;

    // Reset it to undefined if it's empty.
    if (Sojiro.isEmpty(commandprefix)) {
      commandprefix = undefined;
    }

    // By default, return the following.
    return commandprefix || botClientConfig.commandPrefix || botConfig.commandPrefix;
  }

}
