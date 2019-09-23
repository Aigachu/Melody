"use strict";
/**
 * Project Lavenza
 * Copyright 2017-2018 Aigachu, All Rights Reserved
 *
 * License: https://github.com/Aigachu/Lavenza-II/blob/master/LICENSE
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Imports.
const PromptExceptionType_1 = require("./PromptExceptionType");
const Igor_1 = require("../../../Confidant/Igor");
/**
 * Provides a base class for Prompt Exceptions.
 */
class PromptException extends Error {
    /**
     * Prompt constructor.
     */
    constructor(type, message = '') {
        super();
        if (!Object.values(PromptExceptionType_1.default).includes(type)) {
            Igor_1.default.throw(`Invalid PromptException type '{{type}}' used in constructor. Please use a valid type. See /lib/Bot/Prompt/Exception/PromptExceptionTypes for more details.`, { type: type }).then(() => {
                // Do nothing.
            });
        }
        this.type = type;
    }
    /**
     * Override base toString method.
     */
    toString() {
        return `Prompt error of type '` + this.type + `' has occurred!`;
    }
}
exports.default = PromptException;