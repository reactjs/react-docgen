export interface Documentation {
  childContext?: Record<string, PropDescriptor>;
  composes?: string[];
  context?: Record<string, PropDescriptor>;
  description?: string;
  displayName?: string;
  methods?: MethodDescriptor[];
  props?: Record<string, PropDescriptor>;
}

export interface MethodParameter {
  name: string;
  description?: string;
  optional: boolean;
  type?: TypeDescriptor<FunctionSignatureType> | null;
}

export interface MethodReturn {
  description?: string;
  type: TypeDescriptor<FunctionSignatureType> | undefined;
}

export type MethodModifier = 'async' | 'generator' | 'get' | 'set' | 'static';

export interface MethodDescriptor {
  name: string;
  description?: string | null;
  docblock: string | null;
  modifiers: MethodModifier[];
  params: MethodParameter[];
  returns: MethodReturn | null;
}

export interface PropTypeDescriptor {
  name:
    | 'any'
    | 'array'
    | 'arrayOf'
    | 'bool'
    | 'custom'
    | 'element'
    | 'elementType'
    | 'enum'
    | 'exact'
    | 'func'
    | 'instanceOf'
    | 'node'
    | 'number'
    | 'object'
    | 'objectOf'
    | 'shape'
    | 'string'
    | 'symbol'
    | 'union';
  value?: unknown;
  raw?: string;
  computed?: boolean;
  // These are only needed for shape/exact types.
  // Consider consolidating PropTypeDescriptor and PropDescriptor
  description?: string;
  required?: boolean;
}

export interface DefaultValueDescriptor {
  value: unknown;
  computed: boolean;
}

export interface BaseType {
  required?: boolean;
  nullable?: boolean;
  alias?: string;
}

export interface SimpleType extends BaseType {
  name: string;
  raw?: string;
}

export interface LiteralType extends BaseType {
  name: 'literal';
  value: string;
}

export interface ElementsType<T = FunctionSignatureType> extends BaseType {
  name: string;
  raw: string;
  elements: Array<TypeDescriptor<T>>;
}

export interface FunctionArgumentType<T> {
  name: string;
  type?: TypeDescriptor<T>;
  rest?: boolean;
}

export interface FunctionSignatureType extends BaseType {
  name: 'signature';
  type: 'function';
  raw: string;
  signature: {
    arguments: Array<FunctionArgumentType<FunctionSignatureType>>;
    return?: TypeDescriptor<FunctionSignatureType>;
  };
}

export interface TSFunctionSignatureType extends FunctionSignatureType {
  signature: {
    arguments: Array<FunctionArgumentType<TSFunctionSignatureType>>;
    return?: TypeDescriptor<TSFunctionSignatureType>;
    this?: TypeDescriptor<TSFunctionSignatureType>;
  };
}

export interface ObjectSignatureType<T = FunctionSignatureType>
  extends BaseType {
  name: 'signature';
  type: 'object';
  raw: string;
  signature: {
    properties: Array<{
      key: TypeDescriptor<T> | string;
      value: TypeDescriptor<T>;
      description?: string;
    }>;
    constructor?: TypeDescriptor<T>;
  };
}

export type TypeDescriptor<T = FunctionSignatureType> =
  | ElementsType<T>
  | LiteralType
  | ObjectSignatureType<T>
  | SimpleType
  | T;

export interface PropDescriptor {
  type?: PropTypeDescriptor;
  flowType?: TypeDescriptor<FunctionSignatureType>;
  tsType?: TypeDescriptor<TSFunctionSignatureType>;
  required?: boolean;
  defaultValue?: DefaultValueDescriptor;
  description?: string;
}

export default class DocumentationBuilder {
  #props: Map<string, PropDescriptor>;
  #context: Map<string, PropDescriptor>;
  #childContext: Map<string, PropDescriptor>;
  #composes: Set<string>;
  #data: Map<string, unknown>;

  constructor() {
    this.#props = new Map();
    this.#context = new Map();
    this.#childContext = new Map();
    this.#composes = new Set();
    this.#data = new Map();
  }

  addComposes(moduleName: string): void {
    this.#composes.add(moduleName);
  }

  set(key: string, value: unknown): void {
    this.#data.set(key, value);
  }

  get<T>(key: string): T | null;
  get(key: string): unknown {
    return this.#data.get(key);
  }

  getPropDescriptor(propName: string): PropDescriptor {
    let propDescriptor = this.#props.get(propName);

    if (!propDescriptor) {
      this.#props.set(propName, (propDescriptor = {}));
    }

    return propDescriptor;
  }

  getContextDescriptor(propName: string): PropDescriptor {
    let propDescriptor = this.#context.get(propName);

    if (!propDescriptor) {
      this.#context.set(propName, (propDescriptor = {}));
    }

    return propDescriptor;
  }

  getChildContextDescriptor(propName: string): PropDescriptor {
    let propDescriptor = this.#childContext.get(propName);

    if (!propDescriptor) {
      this.#childContext.set(propName, (propDescriptor = {}));
    }

    return propDescriptor;
  }

  build(): Documentation {
    const obj: Documentation = {};

    for (const [key, value] of this.#data) {
      // @ts-expect-error custom handlers can add any properties to Documentation
      obj[key] = value;
    }

    if (this.#props.size > 0) {
      obj.props = {};
      for (const [propName, propDescriptor] of this.#props) {
        if (Object.keys(propDescriptor).length > 0) {
          obj.props[propName] = propDescriptor;
        }
      }
    }

    if (this.#context.size > 0) {
      obj.context = {};
      for (const [contextName, contextDescriptor] of this.#context) {
        if (Object.keys(contextDescriptor).length > 0) {
          obj.context[contextName] = contextDescriptor;
        }
      }
    }

    if (this.#childContext.size > 0) {
      obj.childContext = {};
      for (const [childContextName, childContextDescriptor] of this
        .#childContext) {
        obj.childContext[childContextName] = childContextDescriptor;
      }
    }

    if (this.#composes.size > 0) {
      obj.composes = Array.from(this.#composes);
    }

    return obj;
  }
}
