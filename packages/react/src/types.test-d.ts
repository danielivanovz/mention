import type {
  EditorAdapter,
  MentionInputProps,
  UseMentionMultiProps,
} from "./index.ts";
type User = { id: number; name: string };
type Channel = { slug: string };
export const channels: UseMentionMultiProps<{ "@": User; "#": Channel }> = {
  triggers: {
    "@": { items: [], getKey: (u) => u.id, getLabel: (u) => u.name },
    "#": { items: [], getKey: (c) => c.slug, getLabel: (c) => c.slug },
  },
  onSelect(payload) {
    if ("@" in payload) {
      const name: string = payload["@"].name;
      // @ts-expect-error channel fields cannot leak into a user
      payload["@"].slug;
      void name;
    } else {
      const slug: string = payload["#"].slug;
      void slug;
    }
  },
};
export const input: MentionInputProps = {
  name: "message",
  value: "",
  onChange: (e) => {
    const value: string = e.target.value;
    void value;
  },
  onKeyDown: (e) => e.preventDefault(),
  className: "custom",
};
export function editorContract(editor: EditorAdapter<User>) {
  editor.replace(
    { from: 0, to: 2, text: "@Alice " },
    { id: 1, name: "Alice" },
    { trigger: "@", query: "a", triggerOffset: 0 },
  );
  editor.replace(
    { from: 0, to: 2, text: "bad" },
    // @ts-expect-error replacement requires the editor's item type
    { slug: "general" },
    { trigger: "@", query: "", triggerOffset: 0 },
  );
}
