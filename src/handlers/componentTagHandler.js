/* @flow */
import type Documentation from '../Documentation';

export default function displayNameHandler(documentation: Documentation) {
  const description = documentation.get('description');
  const tagLines = description.split('\n').filter(line => line.includes('@'));

  tagLines.forEach(tagLine => {
    if (tagLine.includes(' ')) {
      documentation.set(
        tagLine.substring(1, tagLine.indexOf(' ')),
        tagLine.substring(tagLine.indexOf(' ') + 1),
      );
    } else {
      documentation.set(tagLine.substring(1), true);
    }
  });
}
