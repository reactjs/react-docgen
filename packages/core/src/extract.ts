import type AstPath from './AstPath.js';
import type { FileState } from './ProjectContext.js';

export interface TypeDescriptor {
  readonly name: string;
  readonly [key: string]: unknown;
}

export interface DefaultValueDescriptor {
  readonly computed: boolean;
  readonly value: string;
}

export interface PropDescriptor {
  defaultValue?: DefaultValueDescriptor;
  description?: string;
  flowType?: TypeDescriptor;
  required: boolean;
  tsType?: TypeDescriptor;
  type?: TypeDescriptor;
}

export interface ComponentDocumentation {
  composes?: string[];
  childContext?: Record<string, Omit<PropDescriptor, 'description'>>;
  context?: Record<string, Omit<PropDescriptor, 'description'>>;
  description: string;
  displayName?: number | string;
  methods: unknown[];
  props?: Record<string, PropDescriptor>;
}

export type Resolver = (file: FileState) => AstPath[];
export type Handler = (
  documentation: ComponentDocumentation,
  path: AstPath,
  file: FileState,
) => void;

export default function extract(
  file: FileState,
  resolver: Resolver,
  handlers: readonly Handler[],
): ComponentDocumentation[] {
  return resolver(file).map((path) => {
    const documentation: ComponentDocumentation = {
      description: '',
      methods: [],
    };

    for (const handler of handlers) {
      handler(documentation, path, file);
    }

    return documentation;
  });
}
