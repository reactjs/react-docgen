/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 *  @flow
 *
 */

export type DocumentationObject = {
  props?: Object,
  context?: Object,
  childContext?: Object,
  composes?: Array<string>,
};

class Documentation {
  _props: Object;
  _context: Object;
  _childContext: Object;
  _composes: Set<string>;
  _data: Object;

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
