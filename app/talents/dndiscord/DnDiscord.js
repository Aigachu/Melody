/**
 * Project Lavenza
 * Copyright 2017-2018 Aigachu, All Rights Reserved
 *
 * License: https://github.com/Aigachu/Lavenza-II/blob/master/LICENSE
 */

// Imports.
import PlayerManager from './src/Player/PlayerManager';
import CreatureManager from './src/Creature/CreatureManager';

/**
 * Example Talent.
 *
 * This class can do *anything* or *nothing*. It's an entry point for extended development of features.
 *
 */
class DnDiscord extends Lavenza.Talent {

  /**
   * @inheritDoc
   */
  static async build(config) {

    // Run default builders.
    /** @catch Stop execution. */
    await super.build(config).catch(Lavenza.stop);

    // Run builders for our Managers.
    await PlayerManager.build().catch(Lavenza.stop);
    await CreatureManager.build().catch(Lavenza.stop);

  }

  /**
   * @inheritDoc
   */
  static async initialize(bot) {

    // Run default initializer to create database collections.
    /** @catch Stop execution. */
    await super.initialize(bot).catch(Lavenza.stop);

    // Run database bootstraps.
    /** @catch Stop execution. */
    await this.bootstrap().catch(Lavenza.stop);

    // Run initialization handlers for child classes.
    await PlayerManager.initialize(this).catch(Lavenza.stop);
    await CreatureManager.initialize(this).catch(Lavenza.stop);

  }

  static async getPlayerData(id) {
    return await PlayerManager.get(id).catch(Lavenza.stop);
  }

  static async registerPlayer(data) {
    await PlayerManager.register(data).catch(Lavenza.stop);
  }

  /**
   * Bootstrap database for DNDiscord. We have a lot to do here!
   *
   * @returns {Promise<void>}
   */
  static async bootstrap() {

    // Run initialization handlers for child classes.
    await PlayerManager.bootstrap(this).catch(Lavenza.stop);
    await CreatureManager.bootstrap(this).catch(Lavenza.stop);

  }
}

module.exports = DnDiscord;