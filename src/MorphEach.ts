import type { Key } from '../types/scaffolding'
import type { Morph } from '../types'

export default class MorphEach<
  Source = unknown,
  Target = Record<Key, unknown>
> implements Morph<Source[], Target[]> {
  private readonly _morph: Morph<Source, Target>

  constructor (morph: Morph<Source, Target>) {
    this._morph = morph
  }

  convert (source: Source[]): Target[] {
    return source.map(v => this._morph.convert(v))
  }
}