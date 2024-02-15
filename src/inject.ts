import type {
  Key,
  KeyOf,
} from '../types/scaffolding'

import fail from '@/fail'

const _inject = (destination: Record<Key, unknown>, path: Key, value: unknown): void => {
  if (typeof destination[path] === 'function') {
    const fn = destination[path] as (value: unknown) => void

    fn.call(destination, value)
  } else {
    destination[path] = value
  }
}

export default <Target>(target: Target, path: KeyOf<Target>, value: unknown): void => {
  if (typeof target !== 'object' || target === null) {
    return fail('Scalar destinations not supported by default injector')
  }

  _inject(target as Record<Key, unknown>, path as Key, value)
}