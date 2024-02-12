import MorphOne from '@/MorphOne'

export default class MorphEach {
  private readonly _morph: MorphOne

  constructor (morph: MorphOne) {
    this._morph = morph
  }

  apply (source: unknown[]): unknown[] {
    return source.map(v => this._morph.apply(v))
  }
}