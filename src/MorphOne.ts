import type {
  Extractor,
  Injector,
  Morph,
  Processor,
} from '../types'

import type {
  Key,
  Maybe,
  Recursive,
  Returns,
} from '../types/scaffolding'

import extract from '@/extract'
import flatten from '@/flatten'
import inject from '@/inject'

export default class MorphOne<
  Source = unknown,
  Target = unknown
> implements Morph<Source, Target> {
  private readonly _target: Returns<Target>
  private readonly _extractors: Map<Key, Extractor<Source>>
  private readonly _injectors: Map<Key, Injector>
  private readonly _processors: Map<Key, (Morph | Processor)[]>

  /**
   * @param {() => unknown} target Defaults to () => ({})
   */
  constructor (target: Returns<Target> = () => ({} as Target)) {
    this._target = target
    this._extractors = new Map<Key, Extractor<Source>>()
    this._injectors = new Map<Key, Injector>()
    this._processors = new Map<Key, (Morph | Processor)[]>()
  }

  convert (source: Source, target?: Target): Target {
    const t = target !== undefined ? target : this._target()

    this._extractors.forEach((extract, path) => {
      const _inject = this._injectors.get(path) ?? inject
      const processors = this._processors.get(path) ?? []

      _inject(t, path, processors.reduce((raw, process) => {
        return 'convert' in process ? process.convert(raw) : process(raw)
      }, extract(source) as unknown))
    })

    return t
  }

  /**
   * Associate a member to another member given their property paths.
   *
   * @param {Key | Key[]} srcPath
   * @param {Key} dstPath
   * @param fallback
   *
   * @return {this} Current instance
   */
  move (
    srcPath: Key | Key[],
    dstPath: Key,
    fallback: unknown = undefined
  ): MorphOne<Source, Target> {
    return this.extract(dstPath, (source: Source) => extract(source, srcPath, fallback))
  }

  /**
   * Applies a field extractor policy to a member.
   *
   * @param {Key} path
   * @param {Extractor} by
   *
   * @return {this} Current instance
   */
  extract (path: Key, by: Extractor<Source>): MorphOne<Source, Target> {
    this._extractors.set(path, by)
    return this
  }

  inject (path: Key, by: Injector<Target>): MorphOne<Source, Target> {
    this._injectors.set(path, by)
    return this
  }

  /**
   * Applies a processor to the field.
   *
   * @param {Key} path
   * @param {Recursive<Morph | Processor>} by Morph or callback
   *
   * @return {this} Current instance
   */
  process (path: Key, by: Recursive<Morph | Processor>): MorphOne<Source, Target> {
    if (Array.isArray(by)) {
      this._processors.set(path, flatten(by))
    } else {
      this._processors.set(path, [by])
    }

    return this
  }

  /**
   * Excludes destination member
   *
   * @param {Key} dstPath Member to exclude
   *
   * @return {this} Current instance
   */
  exclude (dstPath: Key): MorphOne<Source, Target> {
    [this._extractors, this._processors, this._injectors].forEach(map => {
      if (map.has(dstPath)) {
        map.delete(dstPath)
      }
    })

    return this
  }

  override <
    NewTarget = unknown,
    Factory extends Maybe<Returns<NewTarget>> = undefined
  > (destination: Factory = undefined): MorphOne<Source, Factory extends undefined ? Target : ReturnType<Factory>> {
    const morph = new MorphOne<
      Source,
      Factory extends undefined ? Target : ReturnType<Factory>
    >((destination ?? this._target) as Returns<Factory extends undefined ? Target : ReturnType<Factory>>)

    this._extractors.forEach((extractor, path) => {
      morph._extractors.set(path, extractor)
    })

    this._injectors.forEach((injector, key) => {
      morph._injectors.set(key, injector)
    })

    this._processors.forEach((processors, path) => {
      morph._processors.set(path, processors)
    })

    return morph
  }
}