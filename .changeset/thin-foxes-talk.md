---
'react-docgen': major
---

Removed support for the `@extends React.Component` annotation on react class
components.

Instead, you can use the new `@component` annotation or define your own
annotation by creating a custom `FindAnnotatedDefinitionsResolver` instance
