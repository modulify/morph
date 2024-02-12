export type ArrayElement<T> = T extends Array<infer D> ? D : never

export type Key = number | string

export type Maybe<T> = T extends undefined
  ? undefined
  : T | undefined

export type Recursive<T> = T | Recursive<T>[]

export type Returns<T> = () => T
