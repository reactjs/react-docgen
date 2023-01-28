import type { DocumentationObject } from '../Documentation.js';

export default function (
  documentation: DocumentationObject,
): DocumentationObject {
  const props = documentation.props;

  if (props) {
    // props with default values should not be required
    Object.keys(props).forEach((prop) => {
      const propInfo = props[prop];

      if (propInfo.defaultValue) {
        propInfo.required = false;
      }
    });
  }

  return documentation;
}
