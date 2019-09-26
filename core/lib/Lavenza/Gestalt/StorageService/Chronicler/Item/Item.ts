/**
 * Project Lavenza
 * Copyright 2017-2018 Aigachu, All Rights Reserved
 *
 * License: https://github.com/Aigachu/Lavenza-II/blob/master/LICENSE
 */

// Imports.
import {Akechi} from '../../../../Confidant/Akechi';

/**
 * Provides a model to manage YAML files in the Chronicler.
 */
export class Item {

  /**
   * Path to the file this item represents.
   */
  private readonly path: string;

  /**
   * Item constructor.
   *
   * @param path
   *   Path to the file to wrap this item around.
   */
  constructor(path: string) {
    this.path = path;
  }

  /**
   * Return the values of the YAML file.
   *
   * @returns
   *   Returns the data parsed
   */
  public async values(): Promise<any> {
    // We expect a yml. We just reach the path.
    return await Akechi.readYamlFile(this.path);
  }

}