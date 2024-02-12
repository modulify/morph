import type { ArrayElement } from '../types/scaffolding'
import type { Morph } from '../types'

export default class MorphEach<
  Source extends unknown[] = unknown[],
  Target extends unknown[] = unknown[]
> implements Morph<Source, Target> {
  private readonly _morph: Morph<
    ArrayElement<Source>,
    ArrayElement<Target>
  >

  constructor (morph: Morph<
    ArrayElement<Source>,
    ArrayElement<Target>
  >) {
    this._morph = morph
  }

  convert (source: Source): Target {
    return source.map(v => this._morph.convert(v as ArrayElement<Source>)) as Target
  }
}