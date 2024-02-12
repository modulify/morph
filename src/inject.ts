import fail from '@/fail'

const _inject = (destination: Record<string, unknown>, path: string, value: unknown): void => {
  if (typeof destination[path] === 'function') {
    const fn = destination[path] as (value: unknown) => void

    fn.call(destination, value)
  } else {
    destination[path] = value
  }
}

export default (destination: unknown, path: string, value: unknown): void => {
  if (typeof destination !== 'object' || destination === null) {
    return fail('Scalar destinations not supported by default injector')
  }

  _inject(destination as Record<string, unknown>, path, value)
}