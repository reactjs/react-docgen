import type AstPath from './AstPath.js';
import type { FileState } from './ProjectContext.js';

export interface TypeDescriptor {
  readonly name: string;
}

export interface DefaultValueDescriptor {
  readonly computed: boolean;
  readonly value: string;
}

export interface PropDescriptor {
  defaultValue?: DefaultValueDescriptor;
  description: string;
  required: boolean;
  tsType: TypeDescriptor;
}

export interface ComponentDocumentation {
  description: string;
  displayName: string;
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
      displayName: '',
      methods: [],
    };

    for (const handler of handlers) {
      handler(documentation, path, file);
    }

    return documentation;
  });
}
