export const DEFAULT_SPRING_CONFIG = {
  mass: 2,
  damping: 50,
  stiffness: 350,
  overshootClamping: false,
  restSpeedThreshold: 0.001,
  restDisplacementThreshold: 0.001,
}

/**
 * As the name suggests, `sleep` allows you to pause your code execution for a given amount of time
 * @param milliseconds - Amount of time in ms to wait before resuming with JavaScript call stack
 */
export function sleep(milliseconds: number): Promise<void> {
  if (
    !milliseconds ||
    // NOTE: This is necessary to assert that `milliseconds` isn't a string of letters for instance,
    // which ironically returns `true` with `Number.isNan()`
    Number.isNaN(Number.parseInt(String(milliseconds), 10))
  ) {
    throw Error(`${milliseconds} is not a valid number, which sleep() expects`)
  }

  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      resolve(clearTimeout(timeout))
    }, milliseconds)
  })
}
