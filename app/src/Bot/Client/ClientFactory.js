/**
 * Project Lavenza
 * Copyright 2017-2018 Aigachu, All Rights Reserved
 *
 * License: https://github.com/Aigachu/Lavenza-II/blob/master/LICENSE
 */

// Includes
import ClientTypes from './ClientTypes';
import DiscordClient from './DiscordClient/DiscordClient';
// import TwitchClient from './TwitchClient/TwitchClient';
// import SlackClient from './SlackClient/SlackClient';

/**
 * Provide a factory class that manages the creation of the right client given a type.
 */
export default class ClientFactory {

  /**
   * Creates a client instance given a type, bot and configuration.
   *
   * Each type of client has a different class. We will properly decouple and manage the functionality of each type of
   * client.
   *
   * @param {string} type
   *   Type of client to build.
   * @param {Object} config
   *   Configuration object to create the client with, fetched from the bot's configuration file.
   * @param {Bot} bot
   *   Bot that this client will be linked to.
   *
   * @returns {*}
   *   Client that was instantiated.
   */
  static async build(type, config, bot) {

    // Initialize the object.
    let client = {};

    // Depending on the requested type, we build the appropriate client.
    switch (type) {
      case ClientTypes.Discord:
        client = new DiscordClient(config, bot);
        break;

      // case ClientTypes.Twitch:
      //   client = new TwitchClient(config);
      //   break;

      // case ClientTypes.Slack:
      //   client = new SlackClient(config);
      //   break;
    }

    return client;
  }

}
