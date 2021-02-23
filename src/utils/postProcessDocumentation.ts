import type { DocumentationObject } from '../Documentation';

function postProcessProps(
  props: NonNullable<DocumentationObject['props']>,
): void {
  // props with default values should not be required
  Object.keys(props).forEach(prop => {
    const propInfo = props[prop];

    if (propInfo.defaultValue) {
      propInfo.required = false;
    }
  });
}

export default function (
  documentation: DocumentationObject,
): DocumentationObject {
  const props = documentation.props;

  if (props) {
    postProcessProps(props);
  }

  return documentation;
}
