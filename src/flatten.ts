import type { Recursive } from '../types/scaffolding'

function flatten <T>(recursive: Recursive<T>[]): T[] {
  const flattened: T[] = []
  recursive.forEach(element => {
    flattened.push(...(
      Array.isArray(element)
        ? flatten(element)
        : [element]
    ))
  })

  return flattened
}

export default flatten