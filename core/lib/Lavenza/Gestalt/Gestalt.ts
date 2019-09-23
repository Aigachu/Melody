/**
 * Project Lavenza
 * Copyright 2017-2018 Aigachu, All Rights Reserved
 *
 * License: https://github.com/Aigachu/Lavenza-II/blob/master/LICENSE
 */

// Imports.
import TalentManager from '../Talent/TalentManager';
import BotManager from '../Bot/BotManager';
import Morgana from '../Confidant/Morgana';
import Sojiro from '../Confidant/Sojiro';
import Chronicler from './StorageService/Chronicler/Chronicler';
import StorageService from "./StorageService/StorageService";

/**
 * Gestalt manages the storage and retrieval of JSON type data.
 *
 * The name? Well, I just like how it sounds. Haha!
 *
 * Gestalt: "An organized whole that is perceived as more than the sum of its parts."
 *
 * This class serves as the bridge towards the main StorageService that Lavenza will be using. A Storage Service is
 * essentially the service that will access the database of the application, wherever it is stored. It is the job
 * of the StorageService to determine what type of data storage it will access, and the responsibility of it to
 * implement the necessary methods for Lavenza to work. It MUST adopt the structure of a REST protocol: GET
 * POST, UPDATE & DELETE.
 *
 * We want to keep things simple and store JSON type data. In the future, we may explore SQL storage and the like.
 * i.e. MongoDB!
 */
export default class Gestalt {

  /**
   * The storage service that Gestalt will use.
   *
   * This will determine what kind of database storage we'Ll be using.
   */
  private static storageService: StorageService;

  /**
   * Gestalt is a static singleton. This function will handle the preparations.
   */
  static async build() {
    // The default storage service is the Chronicler.
    /** @see ./StorageService/Chronicler/Chronicler */
    // @TODO - Dynamic selection of StorageService instead of having to save it here. Maybe .env variables? Or a configuration file at the root of the application.
    let storageService = new Chronicler();

    // Await the build process of the storage service and assign it to Gestalt.
    await storageService.build();
    Gestalt.storageService = storageService;

    // Some flavor text.
    await Morgana.success("Gestalt preparations complete!");
  }

  /**
   * Bootstrap the database.
   *
   * This creates all database entries needed for the application to function properly.
   */
  static async bootstrap() {
    // Creation of i18n collection.
    // All data pertaining to translations will be saved here.
    await Gestalt.createCollection('/i18n');

    // Bootstrap Database tables/files for bots.
    await BotManager.gestalt();

    // Bootstrap Database tables/files for talents.
    await TalentManager.gestalt();

    // Some flavor text for the console.
    await Morgana.success("Gestalt database successfully bootstrapped!");
  }

  /**
   * Synchronize data between the active storage service and the defaults in the code.
   *
   * @param config
   *   Configuration to sync to the selected source.
   * @param source
   *   The source that needs to be synced.
   *
   * @returns
   *   The result of the data being synchronized with the provided source endpoint.
   */
  static async sync(config: Object, source: string): Promise<any> {
    // Await initial fetch of data that may already exist.
    let dbConfig = await Gestalt.get(source);

    // If the configuration already exists, we'll want to sync the provided configuration with the source.
    // We merge both together. This MIGHT NOT be necessary? But it works for now.
    if (!Sojiro.isEmpty(dbConfig)) {
      return Object.assign({}, config, dbConfig);
    }

    // Await creation of database entry for the configuration, since it doesn't exist.
    await Gestalt.post(source, config);
    return config;
  }

  /**
   * Create a collection in the storage service.
   *
   * We need to keep in mind that we're using mostly JSON storage in this context.
   * This makes use of Collections & Items.
   *
   * @param endpoint
   *   Location where to create the collection.
   * @param payload
   *   The data of the Collection to create.
   */
  static async createCollection(endpoint: string, payload: Object = {}) {
    // Each storage service creates collections in their own way. We await this process.
    await Gestalt.storageService.createCollection(endpoint, payload);
  }

  /**
   * Make a request using the storage service.
   *
   * The linked storage service implements it's own methods of storing and accessing data. Gestalt simply calls those.
   *
   * @param {string} protocol
   *   The protocol we want to use.
   *   The are four: GET, POST, UPDATE, DELETE.
   *    - GET: Fetch and retrieve data from a path/endpoint.
   *    - POST: Create data at a path/endpoint.
   *    - UPDATE: Adjust data at a path/endpoint.
   *    - DELETE: Remove data at a path/endpoint.
   * @param {string} endpoint
   *   The string path/endpoint of where to apply the protocol.
   * @param {Object} payload
   *   The data, if needed, to apply the protocol. GET/DELETE will not need a payload.
   *
   * @returns
   *   The result of the protocol call.
   */
  static async request({protocol = '', endpoint = '', payload = {}} = {}): Promise<any> {
    // Await the request function call of the storage service.
    return await Gestalt.storageService.request({
      protocol: protocol,
      endpoint: endpoint,
      payload: payload
    });
  }

  /**
   * Process a GET request using the storage service.
   *
   * @param endpoint
   *   Path to get data from.
   *
   * @returns
   *   Data retrieved from the given endpoint.
   */
  static async get(endpoint: string): Promise<any> {
    // Await GET request of the Storage Service.
    return await Gestalt.request({protocol: 'get', endpoint: endpoint});
  }

  /**
   * Process a POST request using the storage service.
   *
   * @param endpoint
   *   Path to push data to.
   * @param payload
   *   Data to push to the endpoint.
   *
   * @returns
   *   The data that was posted, if requested.
   */
  static async post(endpoint: string, payload: Object): Promise<any|null> {
    // Await POST request of the Storage Service.
    return await Gestalt.request({protocol: 'post', endpoint: endpoint, payload: payload});
  }

  /**
   * Process a UPDATE request using the storage service.
   *
   * @param endpoint
   *   Path to push data to.
   * @param payload
   *   Data to update at the endpoint.
   *
   * @returns
   *   The resulting state of the data that was updated, if applicable.
   */
  static async update(endpoint: string, payload: Object): Promise<any|null> {
    // Await UPDATE request of the Storage Service.
    return await Gestalt.request({protocol: 'update', endpoint: endpoint, payload: payload});
  }

  /**
   * Process a DELETE request using the storage service.
   *
   * @param endpoint
   *   Path to delete data at.
   */
  static async delete(endpoint: string) {
    // Await DELETE request of the Storage Service.
    return await Gestalt.request({protocol: 'delete', endpoint: endpoint});
  }

}