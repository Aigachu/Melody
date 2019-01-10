/**
 * Project Lavenza
 * Copyright 2017-2018 Aigachu, All Rights Reserved
 *
 * License: https://github.com/Aigachu/Lavenza-II/blob/master/LICENSE
 */

// Imports.
import Listener from '../../Listener/Listener';
import CommandInterpreter from '../CommandInterpreter/CommandInterpreter';
import CommandAuthorizerFactory from "../CommandAuthorizer/CommandAuthorizerFactory";

/**
 * Provides a class for the CommandListener.
 *
 * The CommandListener will handle the determination of whether a received Resonance is a command or not.
 *
 * All the logic for commands starts here.
 */
export default class CommandListener extends Listener {


  /**
   * @inheritDoc
   */
  static async listen(resonance) {

    // Use the CommandInterpreter to find out if there's a command in the resonance.
    // If there's a command, the interpreter will return an order.
    /** @catch Stop execution. */
    resonance.order = await CommandInterpreter.interpret(resonance).catch(Lavenza.stop);

    // If there is no order, we do nothing after all.
    if (!resonance.order) {
      return;
    }

    // Now that we know a command has been found, we need to pass it through the right Authorizer.
    // We use a factory to build an appropriate authorizer.
    /** @catch Stop execution. */
    let authorizer = await CommandAuthorizerFactory.build(resonance).catch(Lavenza.stop);

    // If the help option is used, we fire the help function of the command and return.
    if (resonance.order.args['_'].includes('help') || 'help' in resonance.order.args) {
      resonance.executeHelp();
      return;
    }

    // The CommandAuthorizer checks if the command is authorized in the current context.
    // If for any reason it's unauthorized, we don't do anything with the command.
    /** @catch Stop execution. */
    let authorized = await authorizer.authorize().catch(Lavenza.stop);
    if (!authorized) {
      return;
    }

    // If an order was found, execute it.
    resonance.executeCommand();

    // And at the same time we set the cooldown for the command.
    authorizer.cool();

  }
}