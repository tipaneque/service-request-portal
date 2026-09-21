/**
 * `jest-axe`'s matcher is registered in `vitest.setup.ts`, but its types are
 * written for Jest. This teaches Vitest's `expect` about it so the assertion
 * typechecks like any other matcher.
 */
import 'vitest'

declare module 'vitest' {
  interface Assertion<T = unknown> {
    toHaveNoViolations(): T
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): unknown
  }
}
