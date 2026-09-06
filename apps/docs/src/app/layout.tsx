import type { Metadata } from "next";
import { Archivo, Archivo_Black, JetBrains_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteProvider } from "@/components/site-provider";
import { siteUrl } from "@/lib/site";
import "./global.css";

const display = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const body = Archivo({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-code",
  display: "swap",
});

const designContract = `<!--
THESIS: A working type specimen makes contextual writing the proof.
OWN-WORLD: Navy ink, blue proof, pink context; broad heavy type, flat rectangular controls, real caret.
STORY: Try a trigger, choose an editing host, integrate with the same focused docs humans and agents read.
FIRST VIEWPORT: Small navigation, width-filling lowercase name, descriptor row, broad pink editor, install and start actions, blue host choices.
FORM: Type foundry proof, grounded candidate 4, Ink Block composition, seed 51aacbab.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: "Mention — Context, right where you type.",
    template: "%s · Mention",
  },
  description:
    "Headless mention suggestions for React. Start with a native textarea or connect your rich editor through an adapter.",
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-dvh">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static, authored design annotation; no user content. */}
        <template dangerouslySetInnerHTML={{ __html: designContract }} />
        <SiteProvider>
          <SiteHeader />
          {children}
        </SiteProvider>
      </body>
    </html>
  );
}
