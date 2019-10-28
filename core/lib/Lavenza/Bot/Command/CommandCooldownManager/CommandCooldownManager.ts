/**
 * Project Lavenza
 * Copyright 2017-2019 Aigachu, All Rights Reserved
 *
 * License: https://github.com/Aigachu/Lavenza-II/blob/master/LICENSE
 */

// Imports.
import { Sojiro } from "../../../Confidant/Sojiro";
import { Resonance } from "../../Resonance/Resonance";
import { CommandCooldownConfig } from "../CommandConfigurations";

/**
 * Provide a manager for Command Cooldowns.
 *
 * Each bot should have it's own cooldownsé This class will manage all of that.
 */
export class CommandCooldownManager {

  /**
   * Object to store cooldowns for commands invoked in this bot.
   */
  public static cooldowns: string[] = [];

  /**
   * Heat up a command, rendering it unusable in certain contexts.
   *
   * @param resonance
   *   Resonance containing all necessary information to set the cooldown.
   *   The resonance contains information on the client it's heard from, command used and bot invoked from.
   */
  public static async setCooldown(resonance: Resonance): Promise<void> {
    // If for whatever reason there is no command set to this Resonance, we return.
    const command = await resonance.getCommand();
    if (!command) {
      return;
    }

    // We'll build a cooldown signature given the configurations.
    // First, we get the core command configurations.
    const commandBaseConfig = resonance.instruction.config.base;
    const commandBaseCooldownConfig = commandBaseConfig.cooldown;

    // Then, we get the command's client configurations.
    const commandClientConfig = resonance.instruction.config.client;
    const commandClientCooldownConfig = commandClientConfig.cooldown as CommandCooldownConfig || {} as unknown as CommandCooldownConfig;

    // Now we determine the cooldowns given the configuration objects above.
    const globalCooldownDuration = commandClientCooldownConfig.global || commandBaseCooldownConfig.global || 0;
    const userCooldownDuration = commandClientCooldownConfig.user || commandBaseCooldownConfig.user || 0;

    // If both are set to zero, nothing to do.
    if (globalCooldownDuration === 0 && userCooldownDuration === 0) {
      return;
    }

    // If the global cooldown is set to 0, we don't need to do anything.
    if (globalCooldownDuration !== 0) {
      // Get global signature for the command's usage.
      // When we say Global, we meant Globally within the scope of a Client.
      // This is subject to change in the future.
      const globalSign = await CommandCooldownManager.signature(resonance);
      await CommandCooldownManager.heat(globalSign, globalCooldownDuration);
    }

    // If the user cooldown is set to 0, we don't need to do anything.
    if (userCooldownDuration !== 0) {
      // Get user signature for the command's usage.
      const userSign = await CommandCooldownManager.signature(resonance, [resonance.author.id]);

      // Heat up the command.
      await CommandCooldownManager.heat(userSign, userCooldownDuration);
    }
  }

  /**
   * Heat up a command, readying it for use.
   *
   * @param signature
   *   Signature of the cooldown to heat up.
   * @param duration
   *   Duration to set this cooldown for.
   */
  public static async heat(signature: string, duration: number): Promise<void> {
    // Add the cooldown to the list.
    CommandCooldownManager.cooldowns.push(signature);
    // Start the countdown for the duration.
    setTimeout(
      async () => {
        await CommandCooldownManager.cool(signature);
      },
      duration * 1000,
    );
  }

  /**
   * Cool off a command, readying it for use.
   *
   * @param signature
   *   Signature of the cooldown to ready.
   */
  public static async cool(signature: string): Promise<void> {
    CommandCooldownManager.cooldowns = Sojiro.removeFromArray(CommandCooldownManager.cooldowns, signature) as string[];
  }

  /**
   * Check if a command is heated.
   *
   * @param resonance
   *   Resonance to check for, that includes information on the  command and more.
   */
  public static async check(resonance: Resonance): Promise<boolean> {
    // Contexts to check.
    const globalSign = await CommandCooldownManager.signature(resonance);
    const userSign = await CommandCooldownManager.signature(resonance, [resonance.author.id]);

    return CommandCooldownManager.cooldowns.includes(globalSign) || CommandCooldownManager.cooldowns.includes(userSign);
  }

  /**
   * Make a unique signature.
   *
   * A signature is basically a string that details the nature of resonances. It details the following information:
   *  - The bot that heard the resonance.
   *  - The client the resonance came from.
   *  - The command that was invoked through the resonance.
   *
   * By default, signatures include this information. Supplements can be added to detail further information.
   * For example, to assign cooldowns per user, we need to add the ID of the user that called the command.
   * The base signature will be used to assign global cooldowns (global in the context of the clients).
   *
   * @TODO.
   *    This code may be extended in the future to have the possibility to extend further supplements PER CLIENT.
   *    It may also be extended in the future to have interclient global cooldowns.
   *
   * @param resonance
   *   The resonance to build a signature for.
   * @param supplements
   *   Supplements that should be added to the unique signature.
   */
  private static async signature(resonance: Resonance, supplements: string[] = []): Promise<string> {
    let signature = `${resonance.bot.id}::${resonance.client.type}::${resonance.instruction.command.key}`;
    for (const supplement of supplements) {
      signature += `::${supplement}`;
    }

    return signature;
  }

}
