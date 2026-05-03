import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";

// Side-effect import registers @testing-library/jest-dom matchers AND
// augments Vitest's `expect` types in one shot.
import "@testing-library/jest-dom/vitest";

// vitest-axe@0.1.0 ships an empty extend-expect.js — register the
// matchers manually. The matchers module also augments expect's types.
import * as axeMatchers from "vitest-axe/matchers";
import "vitest-axe/extend-expect";
expect.extend(axeMatchers);

// RTL leaks rendered roots between tests by default — clean up explicitly.
afterEach(() => {
  cleanup();
});
