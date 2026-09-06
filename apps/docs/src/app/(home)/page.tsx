import { ArrowRight, FileText, TextCursorInput } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AgentSetup } from "@/components/agent-setup";
import { CopyButton } from "@/components/copy-button";
import { MentionDemo } from "@/components/mention-demo";
import "./landing.css";

export const metadata: Metadata = {
  title: { absolute: "Mention — Context, right where you type." },
  description:
    "Headless mentions for React. Try people, channels, and commands in a native textarea, or connect a rich editor through an adapter.",
  alternates: { canonical: "/", types: { "text/plain": "/llms.txt" } },
};

export default function HomePage() {
  return (
    <div className="mention-landing">
      <section className="ink-hero" aria-labelledby="hero-title">
        <div className="hero-inner">
          <h1 id="hero-title">
            <span className="hero-word">mention</span>
          </h1>
          <div className="hero-descriptor">
            <p>Context, right where you type.</p>
            <p>Headless mentions for React.</p>
          </div>
        </div>
      </section>
      <MentionDemo />
      <div className="start-band">
        <CopyButton value="bun add @danielivanov/mention" />
        <Link className="foundry-button primary-button" href="/docs">
          Start building <ArrowRight aria-hidden="true" />
        </Link>
        <AgentSetup className="foundry-button" />
      </div>
      <section className="host-section" aria-labelledby="host-title">
        <div>
          <h2 id="host-title">Start with your editor.</h2>
          <p>
            Use a native textarea, or connect a rich editor through an adapter.
            Your editor keeps its document and history.
          </p>
        </div>
        <div className="host-choices">
          <Link href="/docs">
            <TextCursorInput aria-hidden="true" />
            <span>Native textarea</span>
            <ArrowRight aria-hidden="true" />
          </Link>
          <Link href="/docs/rich-text">
            <FileText aria-hidden="true" />
            <span>Rich editor</span>
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section className="reference-section" aria-labelledby="reference-title">
        <div className="reference-intro">
          <h2 id="reference-title">
            Keep the input.
            <br />
            Add the context.
          </h2>
          <p>
            Mention handles detection, suggestions, and the popup. You own the
            data, rendering, and document.
          </p>
          <Link href="/docs/api-reference">
            Explore the API <ArrowRight size={19} aria-hidden="true" />
          </Link>
        </div>
        <div className="recipe-links">
          <Link href="/docs/recipes/async-items">
            <div>
              <h3>Your data</h3>
              <p>
                Start with an array. Connect async search when you need it, with
                cancellation and request states.
              </p>
            </div>
            <ArrowRight size={21} aria-hidden="true" />
          </Link>
          <Link href="/docs/recipes/multi-trigger">
            <div>
              <h3>Your triggers</h3>
              <p>
                People, channels, commands. Give each trigger its own typed
                items and rendering.
              </p>
            </div>
            <ArrowRight size={21} aria-hidden="true" />
          </Link>
          <Link href="/docs/recipes/styling">
            <div>
              <h3>Your design</h3>
              <p>
                Use the optional stylesheet, tune the variables, or style the
                components yourself.
              </p>
            </div>
            <ArrowRight size={21} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section className="agent-section" aria-labelledby="agent-title">
        <div>
          <h2 id="agent-title">Good context for your coding agent, too.</h2>
          <p>
            Give your agent typed examples and Markdown docs for the integration
            you're building.
          </p>
        </div>
        <Link href="/docs/agents">
          Read the agent guide <ArrowRight size={20} aria-hidden="true" />
        </Link>
      </section>
      <footer className="landing-footer">
        <Link href="/" className="site-brand" aria-label="Mention home">
          mention
        </Link>
        <nav aria-label="Footer">
          <Link href="/docs/accessibility">Accessibility</Link>
          <Link href="/docs/internals">Internals</Link>
          <a href="/llms.txt">llms.txt</a>
          <a href="https://github.com/danielivanovz/mention">GitHub</a>
        </nav>
      </footer>
    </div>
  );
}
