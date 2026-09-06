import { Empty } from "./Empty.tsx";
import { Input } from "./Input.tsx";
import { Item } from "./Item.tsx";
import { List } from "./List.tsx";
import { Loading } from "./Loading.tsx";
import { Popover } from "./Popover.tsx";
import { Root } from "./Root.tsx";

/**
 * The `Mention` namespace — all compound parts live as properties.
 *
 *   import { Mention } from "@danielivanov/mention";
 *   <Mention.Root>...<Mention.Input />...</Mention.Root>
 */
export const Mention = {
  Root,
  Input,
  Popover,
  List,
  Item,
  Empty,
  Loading,
} as const;
