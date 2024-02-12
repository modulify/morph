import type {
  ArrayElement,
  Key,
  Maybe,
  Recursive,
  Returns,
} from './scaffolding'

export type Extractor<
  Source = unknown,
  Value = unknown
> = (source: Source) => Value

export type Injector<Destination = unknown> = (
  destination: Destination,
  path: Key,
  value: unknown
) => void

export type Processor<
  Raw = unknown,
  Processed = unknown
> = (value: Raw) => Processed

export interface Morph<Source = unknown, Target = unknown> {
  convert (source: Source): Target;
}

export declare class MorphOne<
  Source = unknown,
  Target = unknown
> implements Morph<Source, Target> {
  /**
   * @param {() => unknown} target Defaults to () => ({})
   */
  constructor (target?: () => Target);

  convert (source: Source): Target;
  convert (source: Source, target: Target): Target;

  /**
   * Associate a member to another member given their property paths.
   *
   * @param {Key | Key[]} srcPath
   * @param {Key} dstPath
   * @param fallback undefined by default
   *
   * @return {this} Current instance
   */
  move (
    srcPath: Key | Key[],
    dstPath: Key,
    fallback?: unknown
  ): MorphOne<Source, Target>;

  /**
   * Applies a field extractor policy to a member.
   *
   * @param {Key} path
   * @param {Extractor} by
   *
   * @return {this} Current instance
   */
  extract (path: Key, by: Extractor<Source>): MorphOne<Source, Target>;

  inject (path: Key, by: Injector<Target>): MorphOne<Source, Target>;

  /**
   * Applies a processor to the field.
   *
   * @param {Key} path
   * @param {Recursive<Morph | Processor>} by Morph or callback or array of Morph & callbacks
   *
   * @return {this} Current instance
   */
  process (path: Key, by: Recursive<Morph | Processor>): MorphOne<Source, Target>;

  /**
   * Excludes destination member
   *
   * @param {Key} dstPath Member to exclude
   *
   * @return {this} Current instance
   */
  exclude (dstPath: Key): MorphOne<Source, Target>;

  override <
    NewTarget = unknown,
    Factory extends Maybe<Returns<NewTarget>> = undefined
  > (destination?: Factory): MorphOne<
    Source,
    Factory extends undefined
      ? Target
      : ReturnType<Factory>
  >;
}

export default class MorphEach<
  Source extends unknown[] = unknown[],
  Target extends unknown[] = unknown[]
> implements Morph<Source, Target> {
  constructor (morph: Morph<
    ArrayElement<Source>,
    ArrayElement<Target>
  >);

  convert (source: Source): Target;
}