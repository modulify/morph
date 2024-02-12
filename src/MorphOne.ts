import type {
  Extractor,
  Injector,
  Processor,
} from '../types'

import type { Recursive } from '../types/scaffolding'

import extract from '@/extract'
import flatten from '@/flatten'
import inject from '@/inject'

export default class MorphOne {
  private _destination: () => unknown
  private readonly _extractors: Map<string, Extractor>
  private readonly _injectors: Map<string, Injector>
  private readonly _processors: Map<string, (MorphOne | Processor)[]>

  /**
   * @param {() => unknown} destination Defaults to () => ({})
   */
  constructor (destination: () => unknown = () => ({})) {
    this._destination = destination
    this._extractors = new Map<string, Extractor>()
    this._injectors = new Map<string, Injector>()
    this._processors = new Map<string, (MorphOne | Processor)[]>()
  }

  /**
   * Sets callback function will be used to create destination if it not set in mapper ::map method
   *
   * @param {() => unknown} destination
   */
  destination (destination: () => unknown): MorphOne {
    this._destination = destination
    return this
  }

  apply (source: unknown, destination?: unknown) {
    const dst = destination !== undefined ? destination : this._destination()

    this._extractors.forEach((extract, path) => {
      const _inject = this._injectors.get(path) ?? inject
      const processors = this._processors.get(path) ?? []

      _inject(dst, path, processors.reduce((raw, process) => {
        return process instanceof MorphOne ? process.apply(raw) : process(raw)
      }, extract(source) as unknown))
    })

    return dst
  }

  /**
   * Associate a member to another member given their property paths.
   *
   * @param {string} dstPath
   * @param {string | string[]} srcPath
   * @param fallback
   *
   * @return {this} Current instance
   */
  move (
    srcPath: string | string[],
    dstPath: string,
    fallback: unknown = undefined
  ): MorphOne {
    return this.extract(dstPath, ((source: unknown) => extract(source, srcPath, fallback)) as Extractor)
  }

  /**
   * Applies a field extractor policy to a member.
   *
   * @param {string} dstPath
   * @param {Extractor} extractor
   *
   * @return {this} Current instance
   */
  extract (dstPath: string, extractor: Extractor): MorphOne {
    this._extractors.set(dstPath, extractor)

    return this
  }

  inject (dstPath: string, injector: Injector): MorphOne {
    this._injectors.set(dstPath, injector)
    return this
  }

  /**
   * Applies a processor to the field.
   *
   * @param {string} dstPath
   * @param {Recursive<MorphOne | Processor>} processor Map name or callback or processor instance
   *
   * @return {this} Current instance
   */
  process (dstPath: string, processor: Recursive<MorphOne | Processor>): MorphOne {
    if (Array.isArray(processor)) {
      this._processors.set(dstPath, flatten(processor))
    } else {
      this._processors.set(dstPath, [processor])
    }

    return this
  }

  /**
   * Removes destination member
   *
   * @param {string} dstPath
   *
   * @return {this} Current instance
   */
  exclude (dstPath: string): MorphOne {
    [this._extractors, this._processors, this._injectors].forEach(map => {
      if (map.has(dstPath)) {
        map.delete(dstPath)
      }
    })

    return this
  }

  clone (): MorphOne {
    const morph = new MorphOne(this._destination)

    this._extractors.forEach((extractor, path) => {
      morph._extractors.set(path, extractor)
    })

    this._processors.forEach((processors, path) => {
      morph._processors.set(path, processors)
    })

    return morph
  }
}