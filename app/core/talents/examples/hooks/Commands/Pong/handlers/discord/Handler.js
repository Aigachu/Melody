/**
 * Project Lavenza
 * Copyright 2017-2018 Aigachu, All Rights Reserved
 *
 * License: https://github.com/Aigachu/Lavenza-II/blob/master/LICENSE
 */

/**
 * A simple Discord client handler for the Pong command.
 *
 * This class simply executes the tasks for a given command, in the context of a client.
 */
export default class Handler extends Lavenza.CommandClientHandler {

  /**
   * Execute this handler's tasks.
   *
   * @inheritDoc
   */
  async execute(data = {}) {

    // Example of accessing the data that was passed in the this.handlers() function call in the command.
    // It'all be found in the data variable.
    // In the case of this example, data.hello should be accessible here.
    console.log(data);

    // You also have access to these!
    console.log(this.command); // The command this handler is being used for.
    console.log(this.resonance); // The resonance, of course!
    console.log(this.directory); // The path to the directory of this handler. Useful if you want to include even more files.

    // Send an additional message when this command is used in Discord clients.
    await this.resonance.__reply('Ah, we seem to be on Discord! This application is so much better than Skype & TeamSpeak. Oof!');

  }

}