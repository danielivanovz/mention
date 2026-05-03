// Local type augmentation for vitest-axe@0.1.0, which still ships its
// matcher types under the deprecated `namespace Vi`. Vitest 4 + the
// jest-dom convention augment `declare module "vitest"` instead, so we
// re-augment that surface to match (was previously `@vitest/expect`,
// but bun workspace hoisting made TS resolve two separate copies of
// `@vitest/expect` and the augmentation only landed on one).
//
// Delete this file once vitest-axe ships a Vitest 4-compatible release
// (tracked upstream at https://github.com/chaance/vitest-axe).

import "vitest";
import type { AxeMatchers } from "vitest-axe/matchers";

declare module "vitest" {
  interface Assertion<T = unknown> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
