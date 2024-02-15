import type {
  Extractor,
  Injector,
  Morph,
  Processor,
} from '../types'

import type {
  Key,
  KeyOf,
  Maybe,
  Path,
  Recursive,
  Returns,
} from '../types/scaffolding'

import extract from '@/extract'
import flatten from '@/flatten'
import inject from '@/inject'

export default class MorphOne<
  Source = unknown,
  Target = Record<Key, unknown>
> implements Morph<Source, Target> {
  private readonly _target: Returns<Target>
  private readonly _extractors: Map<KeyOf<Target>, Extractor<Source>>
  private readonly _injectors: Map<Path<Source, Key | Key[]>, Injector<Target>>
  private readonly _processors: Map<KeyOf<Target>, (Morph | Processor)[]>

  /** @param target Defaults to () => ({}) */
  constructor (target: Returns<Target> = () => ({} as Target)) {
    this._target = target
    this._extractors = new Map<KeyOf<Target>, Extractor<Source>>()
    this._injectors = new Map<Path<Source, Key | Key[]>, Injector<Target>>()
    this._processors = new Map<KeyOf<Target>, (Morph | Processor)[]>()
  }

  convert (source: Source, target?: Target): Target {
    const t = target !== undefined ? target : this._target()

    this._extractors.forEach((extract, key) => {
      const processors = this._processors.get(key) ?? []

      inject(t, key, processors.reduce((raw, process) => {
        return 'convert' in process ? process.convert(raw) : process(raw)
      }, extract(source) as unknown))
    })

    this._injectors.forEach((inject, path) => {
      inject(t, extract(source, path))
    })

    return t
  }

  /**
   * Associate a member to another member given their property paths.
   *
   * @param srcPath Path to property in a source
   * @param dstKey
   * @param fallback Defaults to undefined
   *
   * @return {this} Current instance
   */
  move (
    srcPath: Path<Source, Key | Key[]>,
    dstKey: KeyOf<Target>,
    fallback: unknown = undefined
  ): MorphOne<Source, Target> {
    return this.extract(dstKey, (source: Source) => extract(source, srcPath, fallback))
  }

  /**
   * Applies a field extractor policy to a member.
   *
   * @param key
   * @param by
   *
   * @return {this} Current instance
   */
  extract (
    key: KeyOf<Target>,
    by: Extractor<Source>
  ): MorphOne<Source, Target> {
    this._extractors.set(key, by)
    return this
  }

  inject (
    path: Path<Source, Key | Key[]>,
    by: Injector<Target> | null
  ): MorphOne<Source, Target> {
    const member = Array.isArray(path)
      ? path.join('.') as Path<Source, Key | Key[]>
      : path

    if (by === null) {
      if (this._injectors.has(member)) {
        this._injectors.delete(member)
      }
    } else {
      this._injectors.set(member, by)
    }

    return this
  }

  /**
   * Applies a processor to the field.
   *
   * @param key
   * @param by Morph or callback
   *
   * @return {this} Current instance
   */
  process (
    key: KeyOf<Target>,
    by: Recursive<Morph | Processor>
  ): MorphOne<Source, Target> {
    if (Array.isArray(by)) {
      this._processors.set(key, flatten(by))
    } else {
      this._processors.set(key, [by])
    }

    return this
  }

  /**
   * Excludes destination member
   *
   * @param key Member to exclude
   *
   * @return {this} Current instance
   */
  exclude (key: KeyOf<Target>): MorphOne<Source, Target> {
    [this._extractors, this._processors].forEach(map => {
      if (map.has(key)) {
        map.delete(key)
      }
    })

    return this
  }

  override <
    NewTarget = unknown,
    Factory extends Maybe<Returns<NewTarget>> = undefined
  > (target: Factory = undefined): MorphOne<Source, undefined extends Factory ? Target : ReturnType<Factory>> {
    const morph = new MorphOne<
      Source,
      undefined extends Factory ? Target : ReturnType<Factory>
    >((target ?? this._target) as Returns<undefined extends Factory ? Target : ReturnType<Factory>>)

    this._extractors.forEach((extractor, key) => {
      morph._extractors.set(key as KeyOf<undefined extends Factory ? Target : ReturnType<Factory>>, extractor)
    })

    this._injectors.forEach((injector, key) => {
      morph._injectors.set(key, injector as Injector<undefined extends Factory ? Target : ReturnType<Factory>>)
    })

    this._processors.forEach((processors, key) => {
      morph._processors.set(key as KeyOf<undefined extends Factory ? Target : ReturnType<Factory>>, processors)
    })

    return morph
  }
}