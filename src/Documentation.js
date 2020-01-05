/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { PropDescriptor } from './types';

export type DocumentationObject = {
  props?: { [string]: PropDescriptor },
  context?: { [string]: PropDescriptor },
  childContext?: { [string]: PropDescriptor },
  composes?: Array<string>,
};

class Documentation {
  _props: Map<string, PropDescriptor>;
  _context: Map<string, PropDescriptor>;
  _childContext: Map<string, PropDescriptor>;
  _composes: Set<string>;
  _data: Map<string, any>;

  constructor() {
    this._props = new Map();
    this._context = new Map();
    this._childContext = new Map();
    this._composes = new Set();
    this._data = new Map();
  }

  addComposes(moduleName: string) {
    this._composes.add(moduleName);
  }

  set(key: string, value: any) {
    this._data.set(key, value);
  }

  get(key: string): any {
    return this._data.get(key);
  }

  getPropDescriptor(propName: string): PropDescriptor {
    let propDescriptor = this._props.get(propName);
    if (!propDescriptor) {
      this._props.set(propName, (propDescriptor = {}));
    }
    return propDescriptor;
  }

  getContextDescriptor(propName: string): PropDescriptor {
    let propDescriptor = this._context.get(propName);
    if (!propDescriptor) {
      this._context.set(propName, (propDescriptor = {}));
    }
    return propDescriptor;
  }

  getChildContextDescriptor(propName: string): PropDescriptor {
    let propDescriptor = this._childContext.get(propName);
    if (!propDescriptor) {
      this._childContext.set(propName, (propDescriptor = {}));
    }
    return propDescriptor;
  }

  toObject(): DocumentationObject {
    const obj: DocumentationObject = {};

    for (const [key, value] of this._data) {
      obj[key] = value;
    }

    if (this._props.size > 0) {
      obj.props = {};
      for (const [propName, propDescriptor] of this._props) {
        if (Object.keys(propDescriptor).length > 0) {
          obj.props[propName] = propDescriptor;
        }
      }
    }

    if (this._context.size > 0) {
      obj.context = {};
      for (const [contextName, contextDescriptor] of this._context) {
        if (Object.keys(contextDescriptor).length > 0) {
          obj.context[contextName] = contextDescriptor;
        }
      }
    }

    if (this._childContext.size > 0) {
      obj.childContext = {};
      for (const [childContextName, childContextDescriptor] of this
        ._childContext) {
        obj.childContext[childContextName] = childContextDescriptor;
      }
    }

    if (this._composes.size > 0) {
      obj.composes = Array.from(this._composes);
    }
    return obj;
  }
}

module.exports = Documentation;
