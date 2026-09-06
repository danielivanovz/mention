---
name: Mention
description: A working type specimen for contextual writing.
colors:
  ink: "#172f52"
  proof: "#cfe6f3"
  pink: "#e35980"
  pink-inset: "#fac4d2"
  bg: "#f3f7fc"
  bg-elevated: "#e6eef7"
  fg-muted: "#4a5f79"
  border-subtle: "#bdccde"
  focus: "#9c214a"
  dark-bg: "#14263f"
  dark-bg-elevated: "#1e3654"
  dark-fg: "#e7f1fc"
  dark-fg-muted: "#adc3db"
  dark-border-subtle: "#46607d"
  dark-focus: "#ffadca"
  dark-pink: "#ab3f61"
  dark-pink-inset: "#edb1c3"
  dark-host-ground: "#203e5b"
typography:
  display:
    fontFamily: "Archivo Black, sans-serif"
    fontWeight: 400
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Archivo, sans-serif"
    fontWeight: 650
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Archivo, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.55
  reading:
    fontFamily: "Archivo, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.75
  label:
    fontFamily: "Archivo, sans-serif"
    fontWeight: 500
  code:
    fontFamily: "JetBrains Mono, monospace"
rounded:
  control: "0.375rem"
  inset: "0.25rem"
  avatar: "50%"
spacing:
  compact: "0.5rem"
  related: "0.75rem"
  standard: "1rem"
  comfortable: "1.5rem"
  separated: "2rem"
  section: "3rem"
  page-inset: "clamp(1.25rem, 2.4vw, 3rem)"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0.8rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.fg-muted}"
  button-secondary:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0.8rem 1rem"
  button-secondary-hover:
    backgroundColor: "{colors.bg-elevated}"
  docs-action:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0.5rem 0.75rem"
  textarea:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
  host-choice:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "1.5rem 1.25rem"
  suggestion-popup:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.3rem"
    width: "18rem"
  suggestion-option:
    rounded: "{rounded.inset}"
    padding: "0.3rem 0.6rem"
  suggestion-option-active:
    backgroundColor: "{colors.pink-inset}"
    textColor: "{colors.ink}"
  copy-control:
    rounded: "{rounded.inset}"
  navigation:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.proof}"
---

# Design System: Mention

## Overview

**Creative North Star: "Type foundry proof"**

Mention uses broad, heavy type and solid ink fields to make writing itself the visual material. Navy, proof blue, context pink, and a cool sheet ground give the interface a recognizable identity without ornamental imagery. Real text, an editable caret, and working suggestions supply the detail.

The system covers the website in `apps/docs`, including documentation and agent onboarding. The same type families, semantic theme colors, control geometry, and visible interaction states connect these surfaces. Page density and composition follow each reading or interaction task; the Ink Block landing arrangement belongs to the [surface brief](.impeccable/surfaces/src-app-home-page-tsx.md), not to every future page.

**Key Characteristics:**

- Heavy Archivo Black display paired with ordinary Archivo reading text.
- Solid navy, blue, pink, and sheet regions with clear tonal boundaries.
- Flat rectangular controls, modest corners, and identifying strokes.
- Real writing and selection states; motion follows interaction.
- Shared visual materials across human documentation and agent guidance.

## Colors

The palette pairs cool proof-sheet grounds with dark blue ink and warm pink interaction context. The frontmatter records the actual global values; `dark-` entries are the corresponding `.dark` overrides, not an additional palette to mix into light pages.

### Primary

- **Foundry Ink** (`ink`) carries the wordmark ground, strong text, primary actions, and inverse bands. The light theme's foreground and accent use the same ink.
- **Blue Proof** (`proof`) is the light text on ink and the light-theme editing-host ground. It also becomes the dark theme's accent.

### Secondary

- **Context Pink** (`pink`) establishes the writing specimen's surrounding field.
- **Pink Inset** (`pink-inset`) holds the specimen's controls and provides the light-theme selection material. The landing popup deliberately retains the light pink active fill and ink text in both themes; its selected option does not inherit the darker specimen pink.

### Neutral

- **Cool Sheet** (`bg`) is the reading and input ground; **Raised Sheet** (`bg-elevated`) separates sidebar, code, installation, and hover surfaces by tone.
- **Muted Ink** (`fg-muted`) is supporting text; **Sheet Boundary** (`border-subtle`) identifies fields, dividers, and utility controls.
- **Focus Ink** (`focus`) marks keyboard focus and the caret on sheet surfaces. Inverse ink bands use proof-colored focus outlines. The specimen retains its darker local focus color and an ink textarea outline.
- Dark mode changes sheet, foreground, muted text, borders, focus, specimen pinks, and editing-host ground through semantic variables. The ink navigation and inverse bands retain their identity.

### Named Rules

**The Ink and Sheet Rule.** Use the semantic foreground/background pair for reading and controls; use fixed ink/proof pairs for the inverse brand regions.

## Typography

**Display Font:** Archivo Black, with sans-serif fallback. Its supplied face is weight 400; its drawn forms provide the heavy appearance.

**Body Font:** Archivo, with sans-serif fallback.

**Code Font:** JetBrains Mono, with monospace fallback.

**Character:** The display face is broad and emphatic. Reading text remains ordinary, open, and compact enough for technical material. The hierarchy is role-based rather than a single mathematical scale.

### Hierarchy

- **Display:** Wordmarks and principal headings use Archivo Black with tight tracking. Section headings usually sit near unit line height; page titles can grow fluidly without imposing the landing wordmark's scale on articles.
- **Title:** Repeated recipe titles use medium-heavy Archivo. Article subheadings also use Archivo, with the heavier documented weight of 750 and compact tracking.
- **Body:** Standard text follows the frontmatter body role. Supporting descriptions use muted ink and more open leading where needed.
- **Reading:** Article prose follows the reading role and a maximum measure of 72ch. Introductory article descriptions use 60ch; explanatory landing copy uses shorter measures suited to its columns.
- **Label:** Controls use Archivo, with weight distinguishing actions from supporting instructions. Labels remain sentence case.
- **Code:** Installation commands, inline code, and source blocks use JetBrains Mono. Code color remains functional syntax information, not a source for additional brand accents.

### Named Rules

**The Two Voices Rule.** Archivo Black names and introduces; Archivo explains and operates. Reserve JetBrains Mono for literal code and commands.

## Layout

Shared page edges use the fluid `page-inset` spacing token. Landing content caps at 100rem, while the documentation layout caps at 96rem and retains its article, navigation, and table-of-contents structure. These are observed surface dimensions, not a requirement to give every screen the same columns.

Repeated spacing favors half-rem and whole-rem steps, with three-quarter-rem gaps for related controls. The named spacing entries describe reused values, not an exhaustive scale or a ban on optical adjustments.

Large screens use neighboring content and action groups. At 1100px the editing-host area becomes a single column; at 760px the landing descriptors and reference content stack, installation spans the action row, host choices stack, and the specimen toolbar reorganizes. Below 768px, search becomes a compact icon and documentation combines Browse docs and the section list in one 48px bar. Below 600px, the header keeps the wordmark, Docs, search, and theme controls; secondary destinations remain in the landing content and footer. Documentation retains Fumadocs navigation, search and TOC primitives.

Controls retain usable targets as content wraps. The landing popup is constrained to the viewport, and long installation commands can wrap. Do not shrink a desktop composition until its text becomes the mobile layout.

## Elevation & Depth

The website's authored resting surfaces are flat. Solid grounds, one-pixel boundaries, and contrast between sheet tones establish grouping. Code figures explicitly remove their inherited shadow. Functional suggestion, search, navigation, and failure overlays are the depth exception; this is not a prohibition on overlay depth elsewhere.

### Shadow Vocabulary

- **Specimen popup** (`0 6px 24px #071c3433`): a soft shadow separating the landing suggestions from the writing field. It is not a hard offset card shadow.
- **Search dialog** (`0 16px 64px #08142640`): soft depth over a flat dimmed backdrop, with 12px outer corners and 6px inset controls.
- **Failure feedback** (`0 4px 12px #172f5212`): compact local feedback, without moving the page.
- **Default library popup** (`0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.08)`): retained by documentation examples using the optional library stylesheet. Its system-dark variant increases the shadow opacity. This is an example-level library default, not a second resting-card style.

### Named Rules

**The Flat Surface Rule.** Separate resting content with tone and borders; use soft depth only for active overlays.

## Shapes

Authored buttons, fields, code containers, and major choice controls use the control radius (6px). Smaller suggestion rows and the installation copy control use the inset radius (4px); article and code-copy controls use the standard control radius. One-pixel strokes identify boundaries without creating ornamental frames.

Circular initial avatars are a deliberate identity cue inside people suggestions. The inherited theme switch also uses circular and capsule geometry. These exceptions do not make pills the default action shape. The Clear utility is unboxed, with a divider on larger screens that disappears in its mobile position.

## Components

### Buttons

Direct and rectangular. The primary action inverts foreground and background; secondary actions use an identifying foreground stroke. Their hover states change the ground, with no lifting or scale motion. Main landing actions have a minimum height of 4.6rem, reduced to 3.75rem on mobile; this large treatment is not applied to article utilities.

Body paragraphs use pretty wrapping; headings retain balanced wrapping and the established tracking. Documentation utilities are compact outlined controls with a minimum height of 2.75rem, small Archivo labels, and optional SVG icons. Their ground changes to Raised Sheet on hover. Global keyboard focus uses a two-pixel outline with a four-pixel offset; inverse bands switch its color to proof.

### Cards / Containers

Editing-host choices are substantial outlined links on a lightly mixed sheet ground. Their background becomes the sheet color on hover. The writing specimen uses a pink inset with a sheet textarea, while documentation code and installation use the quieter raised sheet. None of these resting containers receives decorative elevation.

### Inputs / Fields

The live textarea has a visible associated label, a sheet ground, an ink stroke, and the shared control corners. The landing input deliberately uses larger reading type; documentation inputs keep the article's density. The specimen's keyboard focus uses an ink outline (two pixels, three-pixel offset). The textarea is vertically resizable. Documentation examples sit in a raised sheet with a base-sheet input, associated labels and hints, and 44px form actions. Validation appears beside its field; a persistent status area holds the local submission receipt. The running composer, form, and editor examples share their source with the adjacent code blocks.

### Editor Modes

Textarea and Rich editor tabs sit above the landing field in a compact outlined group. The selected tab uses Foundry Ink with Blue Proof text; the group uses control corners and its 44px tab targets use inset corners. Left/Right Arrow, Home, and End move focus; Enter, Space, or click activates the choice. Focus and selection remain distinct, with no decorative transition.

Each editor stays mounted after first use, preserving its independent draft and host-owned history when switching. Rich mode loads Lexical on first activation and shows a local loading status in the field's existing shape. Both modes share the broad writing field, visible associated label, trigger controls, and caret suggestions. A small caption below the controls describes the active host and links directly to its integration guide through an underlined link with the existing Lucide arrow icon. The tab row and caption wrap at narrow widths.

Structured mention tokens in the landing and documentation editors use the existing editing-host ground and foreground colors: Blue Proof with ink text in light mode and the corresponding dark theme pair. Small inset corners (4px) and slight inline padding distinguish inserted tokens while keeping them within the surrounding reading type.

### Navigation

One persistent ink header owns the wordmark, primary links, search, and theme switch across landing and docs. It is 64px high on desktop and 56px below 768px; the logo keeps identical coordinates between routes. Its wordmark and utilities have 44px targets. The Docs link marks the current section with a quiet underline. Documentation uses a raised-sheet sidebar headed Documentation, without a second logo or a desktop collapse mode. Sidebar links are 40px on desktop and 44px on mobile. The mobile section list and Browse docs trigger share one bar. Sticky offsets derive from the shared header height, including anchor navigation.

Internals use the same documentation layout, article actions, search index, and Markdown source as integration guides. Explanations use the article's tables and code treatments; there is no separate marketing layout or simulated DOM/geometry inspector to maintain.

### Mention Suggestions

The signature component is an actual caret-anchored list, not a positioned illustration. People suggestions search the visible full name and insert the corresponding @username; they show initials, the name, and the username that will be inserted. Channels and commands include a useful short description. The landing list has compact inset corners, pink active selection, and a soft popup shadow.

Pointer movement and keyboard navigation update the same selected row. Do not add a separate CSS hover highlight that can disagree with the selected option. Focus stays in the writing host; the list's active state is communicated by selection. Pointer selection completes on click, so pressing and dragging away can cancel. Revealing an option scrolls the suggestion list, preserving the page position while typing. The popup preview in the sidecar records the selected appearance, not a replacement for the library's behavior. Default documentation suggestions use the theme accent and its inverse foreground for selection, with a readable 16rem minimum width capped by the viewport. Keep the theme token pair intact when the library stylesheet is imported by a copied example.

### Code and Retrieval Actions

Copy progress stays in the initiating control: a static hourglass and a visible Copying label identify pending work. The label area reserves space for idle, pending and copied states. Pressed controls change their ground immediately without moving or scaling, and disabled controls do not retain hover or press feedback.

Code uses the shared mono face on the base sheet background, preserving comment contrast with compact copying controls. Complete example files use the existing bounded, keyboard-scrollable code viewport. File and snippet titles name those regions for assistive navigation; the desktop table of contents and mobile documentation controls are named navigation landmarks. The configured highlighter themes are `github-light-high-contrast` and `github-dark-high-contrast`; their individual syntax colors remain highlighter-owned. Installation, code, and article copying share one control that awaits clipboard completion. Article copying also checks the Markdown response status. Success changes the icon and announces completion without moving surrounding content; failures give nearby manual-copy guidance. Article copying and direct Markdown links sit together below the description; a Source action appears only when a matching repository revision is configured. Agent guidance is an article in this same system.

### Agent setup

The landing action and article utilities open the same compact, opaque setup popover. It previews a selectable prompt before copying, includes the current guide when relevant, and links to the coding-agent guide. The prompt uses the displayed site's origin and direct Markdown paths, asks the coding agent to inspect the application first, and preserves editor ownership and explicit verification. No hosted service or agent-specific installation is needed.

The panel uses a 12px outer corner, 6px field/control corners, the existing body face, and a quiet sheet background. Its prompt is ordinary reading text rather than source code. The named 44px close/copy targets, existing Radix dismissal behavior, visible Copied state, manual-copy failure guidance and bounded mobile width follow the rest of the site. Opening is immediate and focuses Copy prompt; dismissal returns focus to Agent setup.

### Interaction

Clear completes the controlled value reset before restoring editor focus and dismissing suggestions, so pasting the same query starts a fresh interaction. It is disabled when there is nothing to clear. Async examples keep a persistent polite status region outside the listbox for loading, result counts, empty results and failure; arrow navigation relies on the active option relationship. A failed search removes the popup and offers an explicit Retry search action, with no automatic retry loop.

Authored landing controls change state without decorative animation. Suggestions appear because the user writes or chooses a trigger; the page does not autofocus the specimen on arrival. Copy success returns to idle after 2400ms. Search opens with three useful documentation destinations, offers a next step on empty or failed queries, and returns focus through the existing Radix close-focus hook. Search entrance/exit uses the inherited opacity/transform at 150ms; the sidebar uses its inherited transform at 180ms. Full-screen blur, result-height transitions and height-animated TOC disclosure are removed. Search results retain native button semantics, identify the current result and use the existing list context to follow keyboard focus. The global reduced-motion rule removes animation and transition duration and restores automatic scrolling.

## Do's and Don'ts

### Do:

- **Do** use semantic theme variables for sheet surfaces, reading text, borders, and ordinary controls.
- **Do** keep the heavy display face distinct from the reading and control face.
- **Do** use flat grounds, identifying strokes, and the established control corners.
- **Do** preserve visible labels, focus, selected states, and wrapping at narrow widths.
- **Do** present agent guidance with the same visual materials and maintained article structure as human documentation.

### Don't:

- **Don't** turn the landing wordmark scale or color-band order into a requirement for documentation pages.
- **Don't** add gradients, simulated surface lighting, or decorative resting-card shadows to this solid-ink world.
- **Don't** replace the editable specimen or its real suggestion state with a raster image.
- **Don't** use mono text, trigger characters, or code syntax colors as generic decoration; the existing trigger characters denote literal inputs.
- **Don't** treat circular avatars or the inherited theme switch as a reason to make every control a pill.

Not canonized: the landing-only wordmark clipping and scaling, individual optical adjustments, inherited framework defaults, and syntax-highlight hues are implementation details rather than reusable design tokens. No outstanding craft defect is promoted into a rule.

Recorded from `src/app/global.css`, `src/app/(home)/landing.css`, the root and documentation layouts, `site-header`, `docs-shell`, `mention-demo`, `copy-button`, `source.config.ts`, and the built landing/documentation captures. The approved world is Type foundry proof / Ink Block, seed `51aacbab`; the built artifact is authoritative where composition details differ. The sidecar's synthesized tonal ramps are preview metadata, not additional application colors or approved contrast pairings.
