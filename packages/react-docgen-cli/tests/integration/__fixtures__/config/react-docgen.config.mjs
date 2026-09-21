export default {
  parse(_code, { filename }) {
    return [{ displayName: filename.endsWith('.js') ? 'Configured' : 'Wrong' }];
  },
};
