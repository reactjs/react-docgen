import React from 'react';

const resolvedName = 'ResolvedDisplayName';

/** Component with a resolved static display name. */
export default class OriginalName extends React.Component {
  static get displayName() {
    return resolvedName;
  }

  render() {
    return <div />;
  }
}
