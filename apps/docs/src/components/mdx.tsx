import { Pre } from "fumadocs-ui/components/codeblock";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { AsyncSearch } from "../../../../packages/react/examples/AsyncSearch";
import { Composer } from "../../../../packages/react/examples/Composer";
import { LexicalDemo } from "../../../../packages/react/examples/Lexical";
import { MessageForm } from "../../../../packages/react/examples/MessageForm";
import { ProseMirrorDemo } from "../../../../packages/react/examples/ProseMirror";
import { DocsCodeBlock } from "./code-block";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    pre: (props) => (
      <DocsCodeBlock {...props}>
        <Pre>{props.children}</Pre>
      </DocsCodeBlock>
    ),
    ProseMirrorDemo,
    LexicalDemo,
    Composer,
    MessageForm,
    AsyncSearch,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
