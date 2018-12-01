/**
 * Project Lavenza
 * Copyright 2017-2018 Aigachu, All Rights Reserved
 *
 * License: https://github.com/Aigachu/Lavenza-II/blob/master/LICENSE
 */

// Imports.
import Chronicler from './StorageService/Chronicler/Chronicler';
import BotManager from '../Bot/BotManager';
import TalentManager from '../Talent/TalentManager';
import Talent from "../Talent/Talent";

/**
 * Gestalt manages the storage and retrieval of JSON type data.
 *
 * The name? Well, I just like how it sounds. Haha!
 *
 * Gestalt: "An organized whole that is perceived as more than the sum of its parts."
 */
export default class Gestalt {

  /**
   * Gestalt is a static singleton. This function will handle the preparations.
   */
  static async prepare() {

    // Set a variable to manage collections effectively.
    // When a collection is created, a tag is associated with it. This allows easy retrieval of a collection later.
    this.collections = {};

    // The default storage service is the Chronicler.
    let storageService = Chronicler; // @TODO - Dynamic selection of StorageService instead of having to save it here.
    await storageService.build().catch(Lavenza.stop);
    this.storageService = storageService;

    // Bootstrap and synchronize database.
    await this.bootstrap().catch(Lavenza.stop);

  }

  static async bootstrap() {
    await this.bootstrapTalentDatabase().catch(Lavenza.stop);
    await this.bootstrapBotDatabase().catch(Lavenza.stop);
  }

  static async bootstrapBotDatabase() {
    // Await creation of Bots Collection.
    /** @catch Stop execution. */
    await this.createCollection('/bots', 'bots').catch(Lavenza.stop);

    await Promise.all(BotManager.bots.map(async bot => {
      // Initialize the database collection for this bot if it doesn't already exist.
      /** @catch Stop execution. */
      this.createCollection(`/bots/${bot.name}`, `bot.${bot.name}`).catch(Lavenza.stop);
      bot.config = await this.sync(bot.config, `/bots/${bot.name}/config`).catch(Lavenza.stop);

      await Promise.all(Object.keys(bot.commands).map(async commandKey => {
        let command = bot.commands[commandKey];
        // Create a database collection for the commands inside of the client of a bot.
        /** @catch Stop execution. */
        await this.createCollection(`/bots/${bot.name}/commands`, `bot.commands`).catch(Lavenza.stop);
        await this.sync(command.config, `/bots/${bot.name}/commands/${command.config.key}`).catch(Lavenza.stop);
      })).catch(Lavenza.stop);

      await Promise.all(bot.talents.map(async talentKey => {
        let talent = TalentManager.talents[talentKey];
        // Create a database collection for the talents inside of the client of a bot.
        /** @catch Stop execution. */
        await this.createCollection(`/bots/${bot.name}/talents`, `bot.talents`).catch(Lavenza.stop);
        await this.sync(talent.config, `/bots/${bot.name}/talents/${talent.id}`).catch(Lavenza.stop);
      })).catch(Lavenza.stop);

      // // Await creation of clients collection for the bot.
      // /** @catch Stop execution. */
      // await this.createCollection(`/bots/${bot.name}/clients`, `bot.${bot.name}.clients`).catch(Lavenza.stop);
      //
      // await Promise.all(Object.keys(bot.clients).map(async clientKey => {
      //   let client = bot.clients[clientKey];
      //   // Create a database collection for the instantiated Client, inside the bot.
      //   /** @catch Stop execution. */
      //   await this.createCollection(`/bots/${bot.name}/clients/${client.type}`, `bot.client.${client.type}`).catch(Lavenza.stop);
      //
      //   await Promise.all(Object.keys(bot.commands).map(async commandKey => {
      //     let command = bot.commands[commandKey];
      //     // Create a database collection for the commands inside of the client of a bot.
      //     /** @catch Stop execution. */
      //     await this.createCollection(`/bots/${bot.name}/clients/${client.type}/commands`, `bot.client.${client.type}.commands`).catch(Lavenza.stop);
      //     await this.sync(command.config, `/bots/${bot.name}/clients/${client.type}/commands/${command.config.key}`).catch(Lavenza.stop);
      //   })).catch(Lavenza.stop);
      //
      //   await Promise.all(bot.talents.map(async talentKey => {
      //     let talent = TalentManager.talents[talentKey];
      //     // Create a database collection for the talents inside of the client of a bot.
      //     /** @catch Stop execution. */
      //     await this.createCollection(`/bots/${bot.name}/clients/${client.type}/talents`, `bot.client.${client.type}.talents`).catch(Lavenza.stop);
      //     await this.sync(talent.config, `/bots/${bot.name}/clients/${client.type}/talents/${talent.id}`).catch(Lavenza.stop);
      //   })).catch(Lavenza.stop);
      //
      // })).catch(Lavenza.stop);
    })).catch(Lavenza.stop);
  }

  static async bootstrapTalentDatabase() {
    // Await creation of Talents Collection.
    /** @catch Stop execution. */
    await this.createCollection('/talents', 'talents').catch(Lavenza.stop);

    // Await creation of Commands Collection.
    /** @catch Stop execution. */
    await this.createCollection('/commands', 'commands').catch(Lavenza.stop);

    await Promise.all(Object.keys(TalentManager.talents).map(async talentKey => {
      let talent = TalentManager.talents[talentKey];
      // Create a database collection for instantiated Talent.
      /** @catch Stop execution. */
      await this.createCollection(`/talents/${talent.id}`, `talent.${talent.id}`).catch(Lavenza.stop);
      talent.config = await this.sync(talent.config, `/talents/${talent.id}/config`).catch(Lavenza.stop);

      await Promise.all(Object.keys(talent.commands).map(async commandKey => {
        let command = talent.commands[commandKey];
        // Create a database collection for the instantiated Command.
        /** @catch Stop execution. */
        await this.createCollection(`/commands/${command.config.key}`, `command.${command.config.key}`).catch(Lavenza.stop);
        command.config = await this.sync(command.config, `/commands/${command.config.key}/config`).catch(Lavenza.stop);
      })).catch(Lavenza.stop);

    })).catch(Lavenza.stop);
  }

  static async sync(config, source) {
    let dbConfig = await Lavenza.Gestalt.get(source).catch(Lavenza.stop);
    if (!Lavenza.isEmpty(dbConfig)) {
      return Object.assign({}, config, dbConfig);
    } else {
      await this.post(source, config).catch(Lavenza.stop);
      return config;
    }
  }

  static async createCollection(endpoint, tag, payload = {}) {
    let collection = await this.storageService.createCollection(endpoint, payload).catch(Lavenza.stop);
    this.collections[tag] = endpoint;
  }

  static async collection(tag) {
    return this.get(this.collections[tag]);
  }

  static async request({protocol = '', endpoint, payload = {}} = {}) {
    return await this.storageService.request({protocol: protocol, endpoint: endpoint, payload: payload}).catch(Lavenza.stop);
  }

  static async get(endpoint) {
    return await this.request({protocol: 'get', endpoint: endpoint}).catch(Lavenza.stop);
  }

  static async post(endpoint, payload) {
    return await this.request({protocol: 'post', endpoint: endpoint, payload: payload}).catch(Lavenza.stop);
  }

  static async update(endpoint, payload) {
    return await this.request({protocol: 'update', endpoint: endpoint, payload: payload}).catch(Lavenza.stop);
  }

  static async delete(endpoint, payload) {
    return await this.request({protocol: 'delete', endpoint: endpoint, payload: payload}).catch(Lavenza.stop);
  }

}