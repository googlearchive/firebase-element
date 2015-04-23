firebase-element
================

**This element is compatible with Polymer 0.5 and lower only, and will be deprecated.**  
You can check out a similar 0.8-compatible version of this element at [https://github.com/polymerelements/firebase-element](https://github.com/polymerelements/firebase-element)

See the [component page](http://polymer.github.io/firebase-element) for more information.

firebase-import
===============

Import files are a new invention, so libraries like [`firebase`](http://firebase.com) do not yet provide them.

`firebase-import` is an intermediary that provides an import file for the `firebase` component. `firebase-import` depends on `firebase`.

Components that want to use `firebase` should depend on `firebase-element` and import `firebase-import` to be safe from library duplication. 
Such components need not use Polymer or `firebase-element`, but we put the import and the element in one package for convenience.
