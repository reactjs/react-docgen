/**
 * Testing render method as public class field.
 */
import view from "./view.jsx";
import {Component as SomeOtherComponent} from 'react';

/**
 * Should be recognized as component.
 */
export default class ExampleComponent extends SomeOtherComponent {
  render = view;
}
