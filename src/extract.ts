import type {
  Key,
  Path,
} from '../types/scaffolding'

import fail from '@/fail'

const _guard = (source: unknown, message: string): void|never => {
  if (typeof source !== 'object' || source === null) {
    return fail(message)
  }
}

const _has = (object: Record<string, unknown>, property: Key, message?: string): void => {
  if (!Object.prototype.hasOwnProperty.call(object, property)) {
    fail(message || 'Object has no property ' + property)
  }
}

const _extract = (source: Record<string, unknown>, path: Key[], prev: Key[]): unknown => {
  if (path.length === 0) {
    return source
  }

  const fullPath = [...prev, ...path].join('.')
  const fullPathNotExist = `Path ${fullPath} is not reachable in the source`

  _has(source, path[0], fullPathNotExist)

  const value = (source as Record<string, unknown>)[path[0]]

  if (path.length === 1) {
    return value
  }

  _guard(value, fullPathNotExist)

  return _extract(value as Record<string, unknown>, path.slice(1), [...prev, path[0]])
}

export default <Source = unknown>(
  source: Source,
  path: Path<Source, Key | Key[]>,
  fallback: unknown = undefined
): unknown => {
  const _path = typeof path === 'string'
    ? path.split('.')
    : typeof path === 'number'
      ? [path]
      : path

  try {
    _guard(source, 'Path extracting not available for scalar types')

    return _extract(source as Record<string, unknown>, _path as Key[], [])
  } catch (error) {
    if (fallback !== undefined) {
      return typeof fallback === 'function' ? fallback() : fallback
    }

    throw error
  }
}