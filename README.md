# @modulify/morph

[![codecov](https://codecov.io/gh/modulify/morph/branch/main/graph/badge.svg)](https://codecov.io/gh/modulify/morph)
[![Tests Status](https://github.com/modulify/morph/actions/workflows/tests.yml/badge.svg)](https://github.com/modulify/morph/actions)
[![npm version](https://badge.fury.io/js/%40modulify%2Fmorph.svg)](https://www.npmjs.com/package/@modulify/morph)

This component helps transform objects into each other by reusable maps. One of the main use cases &ndash; converting
JSON API responses into appropriate form.

Here's an example of how to use it:

```typescript
import {
  MorphEach,
  MorphOne,
} from '@modulify/morph'

const morph = new MorphEach(
  new MorphOne()
    .move('_studio', 'studio')
    .process('studio', new MorphOne()
      .move('_name', 'name'))
    .move('_films', 'films')
    .process('films', new MorphEach(
      new MorphOne()
        .move('_id', 'id')
        .move('_name', 'name')
    ))
)

const collection = morph.convert({
  _studio: { _name: 'Lucasfilm Ltd. LLC' },
  _films: [{
    _id: 1,
    _name: 'Star Wars. Episode IV: A New Hope',
  }, {
    _id: 6,
    _name: 'Star Wars. Episode III. Revenge of the Sith',
  }],
})
```

result is
```json
{
  "studio": { "name": "Lucasfilm Ltd. LLC" },
  "films": [{
    "id": 1,
    "name": "Star Wars. Episode IV: A New Hope"
  }, {
    "id": 6,
    "name": "Star Wars. Episode III. Revenge of the Sith"
  }]
}
```

## Installation

```bash
yarn add @modulify/morph
```

or

```bash
npm i @modulify/morph
```

## API

### Morph

Interface with simple signature:
```typescript
export interface Morph<Source = unknown, Target = unknown> {
  convert (source: Source): Target;
}
```

There is no basic class for this interface. It is used to define signature for __Morph*__ classes.

### MorphOne

Designed to transform source objects into target objects using
a set of user-defined transformations, such as moving, extracting, and injecting values.

#### Constructor

`constructor (target: Returns<Target> = () => ({} as Target))`

The constructor takes one optional argument: target, which is a factory function to create the target object.
If no argument is provided, it defaults to a function returning an empty object `{}`.

#### Methods
* `move (srcPath, dstKey, fallback = undefined)` &ndash; this method defines value extraction from a source at the path
  `srcPath` to the `dstKey` property of the target object;
  the `dstKey` can also be a name of a setter of the target object;
* `extract (key, by)` &ndash; this method defines value extraction from a source to the `key` property of the target
  object by a callback function `by`;
* `inject (path, by)` &ndash; this method defines value injection from a source at the specified `path` by a callback
  function `by`;
* `process (key, by)` &ndash; this method processes a value that is being injected into the `key` property;
* `exclude (key)` &ndash; this method excludes the extraction of the `key` property of the target object;
* `override (target = undefined)` &ndash; this method creates a new `MorphOne` instance with the same
  extraction/injection settings as the instance being overridden. A new target's constructor can be supplied with this
  method if necessary.

### MorphEach

Designed to transform arrays of source objects (`Source[]`) into arrays of target
objects (`Target[]`). Conversion is performed using a provided instance of a `Morph` class (`MorphOne` or else) at
the time of `MorphEach` instance creation.

#### Constructor

`constructor (morph: Morph<Source, Target>)`

The constructor takes one argument: `morph`. This is an instance of a class that implements
the [`Morph`](https://github.com/modulify/morph/blob/main/types/index.d.ts#L25) interface.
These classes are used to transform a source object into a target object.

#### Methods

* `convert (source: Source[]): Target[]`

The `convert` method takes an array of source objects and returns an array of target type objects.
Each object's transformation is carried out using the `Morph` instance provided when creating the `MorphEach` instance.