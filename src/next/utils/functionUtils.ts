export function once<T, A extends any[], R>(
  fn: ((this: T, ...args: A) => R) | null,
  context?: T
) {
  let result: R

  return function (this: T, ...args: A): R {
    if (fn) {
      result = fn.apply(context || this, args)
      fn = null
    }

    return result
  }
}
