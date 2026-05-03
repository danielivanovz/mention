/**
 * Compile-only fixture pinning the `MentionShape` discriminator
 * (C1). The two arms of `MentionChannelConfig` must be mutually
 * exclusive at the type level — supplying `getInsertNode` without
 * `shape: "node"`, or `shape: "node"` without `getInsertNode`, must
 * fail typecheck.
 *
 * This file is import-only — exists to be checked by `tsc --noEmit`,
 * never executed. Vitest's `include` glob skips `*.test-d.ts`.
 */

import type { MentionChannelConfig, MentionSelectMeta } from "./types.ts";

interface User {
  id: number;
  name: string;
}

const items: readonly User[] = [];
const getKey = (u: User) => u.id;
const getLabel = (u: User) => u.name;

// ✓ substring-shape (default, omitted)
const _substringDefault: MentionChannelConfig<User> = {
  items,
  getKey,
  getLabel,
};

// ✓ substring-shape (explicit)
const _substringExplicit: MentionChannelConfig<User> = {
  items,
  getKey,
  getLabel,
  shape: "substring",
};

// ✓ node-shape (both `shape: "node"` and `getInsertNode` supplied)
const _node: MentionChannelConfig<User> = {
  items,
  getKey,
  getLabel,
  shape: "node",
  getInsertNode: (u: User, _meta: MentionSelectMeta) => u.name,
};

// ✗ node-shape missing getInsertNode → @ts-expect-error
// @ts-expect-error: { shape: "node" } requires getInsertNode
const _nodeMissingFn: MentionChannelConfig<User> = {
  items,
  getKey,
  getLabel,
  shape: "node",
};

// ✗ getInsertNode without shape:"node" → @ts-expect-error
// @ts-expect-error: getInsertNode is only valid with shape: "node"
const _fnWithoutShape: MentionChannelConfig<User> = {
  items,
  getKey,
  getLabel,
  getInsertNode: (u: User) => u.name,
};

// C2 — single-trigger MentionRootProps now also surfaces shape +
// getInsertNode. Test the same mutual-exclusion contract.
import type { MentionRootProps } from "./types.ts";

const _rootSubstring: MentionRootProps<User> = {
  items,
  getKey,
  getLabel,
  onSelect: () => {},
  children: null,
};

const _rootNode: MentionRootProps<User> = {
  items,
  getKey,
  getLabel,
  shape: "node",
  getInsertNode: (u: User) => u.name,
  onSelect: () => {},
  children: null,
};

// Anchor exports so TS doesn't tree-shake the fixture into nothing.
export type _Pinned =
  | typeof _substringDefault
  | typeof _substringExplicit
  | typeof _node
  | typeof _nodeMissingFn
  | typeof _fnWithoutShape
  | typeof _rootSubstring
  | typeof _rootNode;
