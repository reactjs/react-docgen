import NodePathSerializer from './NodePathSerializer.js';
import { expect } from 'vitest';

expect.addSnapshotSerializer(NodePathSerializer);
