/**
 * Project Lavenza
 * Copyright 2017-2018 Aigachu, All Rights Reserved
 *
 * License: https://github.com/Aigachu/Lavenza-II/blob/master/LICENSE
 */

/**
 * Argument handler for the 'register' argument in the DND command.
 */
export default class Register {

  /**
   * Handle command 'register' option.
   *
   * @param {Resonance} resonance
   *   Resonance that issued the command.
   * @param {*} command
   *   Command that this argument handler is being used for.
   *
   */
  static async handle(resonance, command) {
    await this.registration(resonance, command).catch(Lavenza.continue);
  }


  /**
   * Handle command 'register' option.
   *
   * @param {Resonance} resonance
   *   Resonance that issued the command.
   * @param {*} core
   *   Core DNDiscord Talent.
   *
   */
  static async registration(resonance, core) {

    // If a player already exists for this user, we should tell them this.
    // Get the player identity of the Discord user that sent the resonance.
    let playerData = await core.getPlayerData(resonance.message.author.id);

    // If player data already exists, we exit the process here.
    if (!Lavenza.isEmpty(playerData)) {
      await resonance.reply(`Hey, you already have an account! You don't need to register again.`);
      return;
    }

    // Define variable to store the conversation channel.
    let conversationChannel = resonance.message.channel;

    // Now we want to check if the request was done in DMs. If not, we tell the player that we'll DM them shortly.
    if (resonance.message.channel.type !== "dm") {

      // Make her type for a bit.
      await resonance.client.typeFor(2, conversationChannel);

      // Tell the user we'll take this to the DMs.
      await resonance.reply(`Ooh, you wanna register for DNDiscord? Alright! I'll dm you in a second!`);

      // Wait 5 seconds.
      await Lavenza.wait(5);

      // Create a DMChannel between the bot and the user (to make sure it exists).
      await resonance.message.author.createDM().catch(Lavenza.stop);

      // Set the conversation channel.
      conversationChannel = resonance.message.author.dmChannel;
    }

    // We'll progressively build the player's data.
    playerData = {};

    // Set the Player's ID. It will be the same as their Discord User ID.
    playerData.id = resonance.message.author.id;

    // Set the creation timestamp.
    playerData.creationDate = Date.now();

    // Let's add some flavor to it. Make her type for a bit.
    await resonance.client.typeFor(2, conversationChannel);

    // A little welcome message.
    await resonance.send(conversationChannel, `Welcome to **Dungeons & Discord**!`).catch(Lavenza.stop);

    // Type for 3 seconds.
    await resonance.client.typeFor(3, conversationChannel);

    // Ask the player if they want green tea.
    /** @catch Throw the error to stop execution. */
    await resonance.bot.prompt(`First thing's first, to break the ice, would you like some green tea?`, conversationChannel, resonance, 30, async (responseResonance, prompt) => {

      // Type for 2 seconds.
      await resonance.client.typeFor(2, conversationChannel);

      // Check if the user confirms.
      if (Lavenza.Sojiro.isConfirmation(responseResonance.content)) {

        // Save the green tea for later.
        await resonance.send(conversationChannel, `Awesome! I'll get started on that right away. In the meantime...`).catch(Lavenza.stop);
        playerData.greenTea = true;

      } else {
        await resonance.send(conversationChannel, `Oh! That's completely fine. Moving on...`).catch(Lavenza.stop);
      }

    }).catch(async error => {
      await resonance.send(conversationChannel, `Seems like you couldn't answer me in time...That's alright! You can try again later. :)`);

      // We forcefully throw an error here to end execution. This means that without this prompt, we shouldn't proceed.
      await Lavenza.throw(error);
    });

    // Type for 4 seconds.
    await resonance.client.typeFor(4, conversationChannel);

    // Ask the player more questions...
    // await resonance.bot.addPrompt(`First of all, would you like some green tea? (Y/n)`, resonance, 10, async (responseResonance, prompt) => {
    //
    // }).catch(Lavenza.stop);

    // Little conclusion.
    await resonance.send(conversationChannel, `Okay so, normally I'd ask you a bunch of questions, but it seems like Aiga's been lazy as usual...:sweat_smile:`);

    // Register the player.
    await core.registerPlayer(playerData).catch(Lavenza.stop);

    // More conclusions.
    await resonance.client.typeFor(4, conversationChannel);
    await resonance.send(conversationChannel, `I went ahead and created your player in my database. You should be set. Your next step will be to create a character! Use \`;° dnd --newgame\` to get started with that.`);
    await resonance.client.typeFor(4, conversationChannel);
    await resonance.send(conversationChannel, `Remember to let your imagination run wild! And have fun. :)`);

    // If the player asked for tea in the beginning, hand it to them!
    if (playerData.greenTea) {
      await Lavenza.wait(10).catch(Lavenza.stop);
      await resonance.client.typeFor(2, conversationChannel);
      resonance.send(conversationChannel, `Wait! I almost forgot...Here's your tea! - {{tea}}`, {tea: ':tea:'}).catch(Lavenza.stop);
    }
  }
}