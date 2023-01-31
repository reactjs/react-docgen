import type { DocumentationObject } from '../Documentation.js';

export default function (
  documentation: DocumentationObject,
): DocumentationObject {
  const props = documentation.props;

  if (props) {
    Object.values(props).forEach((propInfo) => {
      // props with default values should not be required
      if (propInfo.defaultValue) {
        propInfo.required = false;
      }
    });
  }

  return documentation;
}
