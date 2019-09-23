/**
 * Project Lavenza
 * Copyright 2017-2018 Aigachu, All Rights Reserved
 *
 * License: https://github.com/Aigachu/Lavenza-II/blob/master/LICENSE
 */

// Imports.
import Sojiro from "../../../../../../../lib/Lavenza/Confidant/Sojiro";
import PromptExceptionType from "../../../../../../../lib/Lavenza/Bot/Prompt/Exception/PromptExceptionType";
import ClientType from "../../../../../../../lib/Lavenza/Bot/Client/ClientType";
import Resonance from "../../../../../../../lib/Lavenza/Bot/Resonance/Resonance";
import Coinflip from "../../Coinflip";

/**
 * Argument handler for the 'guess' argument in the Coinflip command.
 */
export default class GuessGameArgHandler {

  /**
   * Handle command 'd' & 'duel' options.
   *
   * @param command
   *   The command that invoked this argument handler.
   * @param resonance
   *   Resonance that issued the command.
   * @param input
   *   The value of the duel parameter sent by the user.
   */
  static async handle(command: Coinflip, resonance: Resonance, input: any) {
    // @TODO - Twitch support will come later.
    if (resonance.client.type === ClientType.Twitch) {
      await resonance.__reply(`Unfortunately, the Coinflip Guessing Game are not yet supported on Twitch! Give it a try on Discord!`, '::COINFLIP-GUESS_GAME_NO_TWITCH_SUPPORT');
      return;
    }

    // First order of business is determining who the user wants to duel.
    // Initialize with a  message that serves as an introduction.
    // Depending on the client, handle the first sending of the message properly.
    await resonance.__reply(`Oooh {{user}}, a guessing game?! Haha, that's exciting!`, {
      user: resonance.author,
    }, '::COINFLIP-GUESS_GAME_INITIAL_MESSAGE');

    // Type for a little bit.
    await resonance.typeFor(2, resonance.message.channel);

    // If the input is set the 'true', that means there is no input added to the 'd' or 'duel' arguments.
    // We need to ask them for input containing the name of the opponent they'd like to duel.
    if (input === true) {
      input = await this.promptForInput(command, resonance);
    }

    // If no input was provided and opponent is set to null, gracefully exit.
    if (input === null) {
      return;
    }

    // Fetch opponent from the input provided.
    // We use client handlers to have different fetch methods per client.
    let opponent = await command.fireClientHandlers(resonance, {
      userInput: input,
    }, 'getOpponent');


    // If an opponent could not be determined, we can't duel!
    if (opponent === undefined) {
      // Type for a little bit.
      await resonance.typeFor(2, resonance.message.channel);

      // Send a message stating that the opponent could not be determined.
      await resonance.__reply(`Hmm...I had trouble identifying your opponent. Make sure you enter their exact name, or tag them directly if you're on Discord!`, {
        user: resonance.author,
      }, '::COINFLIP-GUESS_GAME_OPPONENT_UNDEFINED');

      // End execution.
      return;
    }

    // At this point, we know the opponent is defined.
    // If the opponent is the same as the user, we drag them.
    if (opponent.id === resonance.author.id) {
      await resonance.__reply(`...Unfortunately, you can't challenge yourself {{user}}! Come on now. :P`, {
        user: resonance.author,
      }, '::COINFLIP-GUESS_GAME_YOURSELF');
      return;
    }

    // Get the confirmation from the opponent.
    let confirmation = await this.confirmWithOpponent(command, resonance, opponent);

    // If our confirmation isn't...Confirmed...We end execution.
    if (!confirmation) {
      return;
    }

    // Add some typing suspense.
    await resonance.typeFor(3, resonance.message.channel);

    // Now we can actually go forth with the duel!
    await resonance.__reply(`Ladies and gentlemen, we have ourselves a duel!`, '::COINFLIP-GUESS_GAME_CONFIRMED');

    // Add some typing suspense.
    await resonance.typeFor(2, resonance.message.channel);

    // We'll go ahead and send a message, and also flip 2 coins to have the results.
    await resonance.__reply(`Alright. I'm flipping a coin for each of you...`, '::COINFLIP-GUESS_GAME_START_FLIPS');
    let challengerResult = await Coinflip.flipACoin();
    let opponentResult = await Coinflip.flipACoin();

    // Add some typing suspense.
    await resonance.typeFor(3, resonance.message.channel);

    // Announce that the results are ready!
    await resonance.__reply(`Two coins flipped...I have the results right here. Hehe this is exciting!`, '::COINFLIP-GUESS_GAME_RESULTS_CONFIRMED');

    // We pick one of the players at random.
    let guesser = Math.floor(Math.random() * 2) === 0 ? resonance.author : opponent;
    let prayer = guesser.id === resonance.author.id ? opponent : resonance.author;

    // Add some typing suspense.
    await resonance.typeFor(2, resonance.message.channel);

    // Now we can actually go forth with the duel!
    await resonance.__reply(`{{guesser}}! It's up to you to guess if both coin flips resulted in the **Same** result, or
    ended up with **Different** results.`, {
      guesser: guesser,
    },'::COINFLIP-GUESS_GAME_RANDOM_PLAYER_GUESS');

    // Add some typing suspense.
    await resonance.typeFor(3, resonance.message.channel);

    // Initialize variable to store the victor.
    let victor = undefined;

    // Start the prompt.
    await resonance.__reply(`You have 10 seconds...**Starting now.**\n\nType in **Same** or **Different**!`, '::COINFLIP-GUESS_GAME_RANDOM_PLAYER_GUESS_START');

    // Start up a prompt for the guesser's input.
    await resonance.prompt(guesser, resonance.message.channel, 10, async (responseResonance, prompt) => {
      // Now we'll try to determine what the guesser said.
      let guess = responseResonance.content.toLowerCase();

      // If the guesser says 'same', and the results are in fact the same, then they win.
      if (guess === 'same' && challengerResult === opponentResult) {
        victor = 'guesser';
      }
      // If the guesser says 'different', and the results are in fact different, then they win.
      else if ((guess === 'different' || guess === 'diff') && challengerResult !== opponentResult) {
        victor = 'guesser';
      }
      // If the guesser provides an invalid guess, we restart the prompt.
      else if (guess !== 'same' && guess !== 'different' && guess !== 'diff') {
        await prompt.reset({error: PromptExceptionType.INVALID_RESPONSE});
      }
      // Otherwise, the prayer wins.
      else {
        victor = 'prayer';
      }
    }, async (error) => {

      // Depending on the type of error, you can send different replies.
      switch (error.type) {

        // This is ran when no response is provided.
        case PromptExceptionType.NO_RESPONSE: {
          // Failing to reply will simply send a different message.
          await resonance.__reply(`AAAHH {{guesser}}, you failed to respond in time! This is considered a forfeit. As such, the victor is {{victor}}!!! Congratulations!`, {
            victor: prayer,
          }, '::COINFLIP-GUESS_GAME_GUESSER_NO_RESPONSE');
          break;
        }

        // This is ran when the max amount of resets is hit.
        case PromptExceptionType.MAX_RESET_EXCEEDED: {
          // Failing to reply will simply send a different message.
          await resonance.__reply(`{{guesser}}, COME ON! It's either **Same** or **Different**!!! WHAT DON'T YOU GET?!\nUgh whatever! The victor is {{victor}}. ENJOY YOUR FREEBIE!`, {
            victor: prayer,
          }, '::COINFLIP-GUESS_GAME_GUESSER_MAX_TRIES');
          break;
        }

        // This is the message sent when no response is provided.
        case PromptExceptionType.INVALID_RESPONSE: {
          await resonance.__reply(`That's not a valid answer {{guesser}}! It's either **Same** or **Different**! Try again!`, '::COINFLIP-GUESS_GAME_GUESSER_INVALID_INPUT');
          break;
        }
      }
    });

    // If the victor isn't determined, there is nothing left to say!
    if (victor === undefined) {
      return;
    }

    // Otherwise, we announce the results and the winner!
    await resonance.__reply(`ALRIGHT! Time for the reveal!`, '::COINFLIP-GUESS_GAME_REVEAL');

    // Add some typing suspense.
    await resonance.typeFor(2, resonance.message.channel);

    // Reveal the result of the first coin.
    await resonance.__reply(`The first coin resulted in...**{{result}}**!`, {
      result: challengerResult,
    }, '::COINFLIP-GUESS_GAME_REVEAL_FIRST_COIN');

    // Add some typing suspense.
    await resonance.typeFor(2, resonance.message.channel);

    // Reveal the result of the second coin.
    await resonance.__reply(`The second coin resulted in...**{{result}}**!`, {
      result: opponentResult,
    }, '::COINFLIP-GUESS_GAME_REVEAL_SECOND_COIN');

    // If the guesser wins, we have some text.
    if (victor === 'guesser') {
      await resonance.__reply(`Looks like you were right, {{guesser}}! VICTORY IS YOURS! Haha, good job. :)\nBetter luck next time {{prayer}}!`, {
        guesser: guesser,
        prayer: prayer,
      }, '::COINFLIP-GUESS_GAME_GUESSER_WIN');
    } else {
      await resonance.__reply(`OOF, {{guesser}}! YOU WERE WRONG! The win goes to {{prayer}}!`, {
        guesser: guesser,
        prayer: prayer,
      }, '::COINFLIP-GUESS_GAME_PRAYER_WIN');
    }
  }

  /**
   * Prompt for user input.
   *
   * This is used when an opponent isn't tagged directly in the command invocation.
   *
   * @param command
   *   The command that invoked this argument handler.
   * @param resonance
   *   Resonance that issued the command.
   */
  static async promptForInput(command: Coinflip, resonance: Resonance) {
    // Initialize variable to store input.
    let input = '';

    // Depending on the client, handle the sending of the message properly.
    await resonance.__reply(`Who would you like to challenge?`, {
      user: resonance.author,
    }, '::COINFLIP-GUESS_GAME_ASK_WHO');

    // Activate a prompt waiting for the user to tell us who they want to duel.
    // noinspection JSUnusedLocalSymbols
    await resonance.prompt(resonance.author, resonance.message.channel, 10, async (responseResonance, prompct) => {
      // Set whatever input the user provided. We'll return it later.
      input = responseResonance.content;
    }, async (error) => {

      // Depending on the client, handle the sending of the message properly.
      await resonance.__reply(`...Since you decided to ignore my question, I'm canceling the game! Feel free to try again later when you're ready, {{user}}!`, {
        user: resonance.author,
      }, '::COINFLIP-GUESS_GAME_ASK_NO_RESPONSE');

      input = null;
    });

    return input;
  }

  /**
   * Attempt to get a confirmation from the opponent that was challenged.
   *
   * The opponent will be prompted and the answer will determine whether or not the duel will happen.
   *
   * @param command
   *   The command that invoked this argument handler.
   * @param resonance
   *   Resonance that issued the command.
   * @param opponent
   *   The opponent determined from the input.
   */
  static async confirmWithOpponent(command: Coinflip, resonance: Resonance, opponent: any) {
    // Initialize confirmation.
    let confirmation = false;

    // Add some typing suspense.
    await resonance.typeFor(2, resonance.message.channel);

    // Send a message to the opponent.
    await resonance.__reply(`{{opponent}}, looks like {{user}} wants to challenge you to a guessing game showdown. Do you accept?`, {
      user: resonance.author,
      opponent: opponent,
    }, '::COINFLIP-GUESS_GAME_OPPONENT_CONFIRM');

    // Start up a prompt for the opponent's input.
    // noinspection JSUnusedLocalSymbols
    await resonance.prompt(opponent, resonance.message.channel, 10, async (responseResonance, prompt) => {
      // If the opponent sends a confirmation, we set confirmation to true.
      // Otherwise, send a sad message. :(
      if (Sojiro.isConfirmation(responseResonance.content)) {
        confirmation = true;
      } else {
        await resonance.__reply(`Aww ok. Maybe another time then!`, '::COINFLIP-GUESS_GAME_DECLINED');
      }
    }, async (error) => {
      // Failing to reply will simply send a different message.looks like th
      await resonance.__reply(`Hmm, they're not available right now. Try again later!`, {
        opponent: opponent,
      }, '::COINFLIP-GUESS_GAME_OPPONENT_FAILED_CONFIRMATION');
    });

    return confirmation;
  }

}