/**
 * Testing render method as public class field.
 */
import view from "./view.jsx";
/**
 * Should be recognized as component.
 */
export default class ExampleComponent extends SomeOtherComponent {
  render = view;
}
