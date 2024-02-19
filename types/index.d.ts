import type {
  Key,
  KeyOf,
  Maybe,
  Path,
  Recursive,
  Returns,
} from './scaffolding'

export type Extractor<
  Source = unknown,
  Value = unknown
> = (source: Source) => Value

export type Injector<Target = unknown> = (
  destination: Target,
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
  Target = Record<Key, unknown>
> implements Morph<Source, Target> {
  /** @param target Defaults to () => ({}) */
  constructor (target?: () => Target);

  convert (source: Source): Target;
  convert (source: Source, target: Target): Target;

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
    fallback?: unknown
  ): MorphOne<Source, Target>;

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
  ): MorphOne<Source, Target>;

  inject (
    path: Path<Source, Key | Key[]>,
    by: Injector<Target> | null
  ): MorphOne<Source, Target>;

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
  ): MorphOne<Source, Target>;

  /**
   * Excludes destination member
   *
   * @param key Member to exclude
   *
   * @return {this} Current instance
   */
  exclude (key: KeyOf<Target>): MorphOne<Source, Target>;

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

export declare class MorphEach<
  Source = unknown,
  Target = Record<Key, unknown>
> implements Morph<Source[], Target[]> {
  constructor (morph: Morph<Source, Target>);

  convert (source: Source[]): Target[];
}