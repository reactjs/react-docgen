import { file, program } from '@babel/types';
import FileState from '../FileState.js';

export default class FileStateMock extends FileState {
  constructor() {
    super(
      {},
      {
        code: '',
        ast: file(program([])),
        importer: () => {
          return null;
        },
      },
    );
  }
}
