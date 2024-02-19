export type Key = number | string

export type KeyOf<T> = unknown extends T ? Key : keyof T

export type Maybe<T> = T extends undefined
  ? T
  : T | undefined

export type PathArray<T, K extends keyof T> =
  K extends string
    ? T[K] extends Record<Key, unknown>
      ?
      | [K, ...PathArray<T[K], Exclude<keyof T[K], keyof unknown[]>>]
      | [K, Exclude<keyof T[K], keyof unknown[] & string | symbol>]
      : never
    : never;

export type PathString<T, K extends keyof T> =
  K extends string
    ? T[K] extends Record<Key, unknown>
      ?
        | `${K}.${PathString<T[K], Exclude<keyof T[K], keyof unknown[]>> & string}`
        | `${K}.${Exclude<keyof T[K], keyof unknown[] & string | symbol>}`
      : never
    : never;

export type Path<T, F = never> = unknown extends T
  ? F
  :
  | keyof T
  | PathArray<T, keyof T>
  | PathString<T, keyof T>

export type Recursive<T> = T | Recursive<T>[]

export type Returns<T> = () => T
