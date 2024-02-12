export type Recursive<T> = T | Recursive<T>[]

export type Injector = <D = unknown>(destination: D, path: string, value: unknown) => void