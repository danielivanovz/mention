export type PopoverPhase = "closed" | "open";

export interface PopoverState {
  readonly phase: PopoverPhase;
  readonly trigger: string | null;
  readonly query: string;
  /** Index of the highlighted option, or -1 when none should be active. */
  readonly highlightedIndex: number;
  /** Number of items currently visible in the listbox. */
  readonly itemCount: number;
  /**
   * Slack/Notion-style two-step backspace. Chip id (matching
   * `data-mention-id`) currently in the "selected, press Backspace
   * again to delete" state, or `null`. Lives independently of `phase`
   * so chip selection survives popover open/close transitions.
   */
  readonly chipSelected: string | null;
}

export type PopoverAction =
  | {
      readonly type: "ITEMS_CHANGED";
      readonly itemCount: number;
    }
  | { readonly type: "HIGHLIGHT_NEXT" }
  | { readonly type: "HIGHLIGHT_PREV" }
  | { readonly type: "HIGHLIGHT_AT"; readonly index: number }
  | {
      // State-derived dispatch from `useMention`'s handleChange: the
      // dispatcher has scanned the textarea backwards from the caret and
      // resolved an active mention. The reducer just reflects the result.
      readonly type: "OPEN_AT";
      readonly trigger: string;
      readonly query: string;
    }
  | { readonly type: "DISMISS" }
  | { readonly type: "COMMIT" }
  | { readonly type: "CHIP_SELECT"; readonly id: string }
  | { readonly type: "CHIP_DESELECT" };

const CLOSED_BASE = {
  phase: "closed" as const,
  trigger: null,
  query: "",
  highlightedIndex: -1,
  itemCount: 0,
};

const CLOSED: PopoverState = { ...CLOSED_BASE, chipSelected: null };

export function popoverReducer(
  state: PopoverState,
  action: PopoverAction,
): PopoverState {
  switch (action.type) {
    case "ITEMS_CHANGED": {
      // Late-arriving async fetches must not wake a dismissed popover.
      if (state.phase === "closed") return state;
      return {
        ...state,
        itemCount: action.itemCount,
        highlightedIndex: action.itemCount > 0 ? 0 : -1,
      };
    }
    case "HIGHLIGHT_NEXT": {
      if (state.itemCount === 0) return state;
      return {
        ...state,
        highlightedIndex: (state.highlightedIndex + 1) % state.itemCount,
      };
    }
    case "HIGHLIGHT_PREV": {
      if (state.itemCount === 0) return state;
      const last = state.itemCount - 1;
      return {
        ...state,
        highlightedIndex:
          state.highlightedIndex <= 0 ? last : state.highlightedIndex - 1,
      };
    }
    case "HIGHLIGHT_AT": {
      // Pointer-move dispatcher. Bounds-check belt-and-braces; the
      // handler upstream guards on `mouseMoving` to suppress synthetic
      // moves when the popover renders under a stationary cursor.
      if (state.phase === "closed") return state;
      if (action.index < 0 || action.index >= state.itemCount) return state;
      if (state.highlightedIndex === action.index) return state;
      return { ...state, highlightedIndex: action.index };
    }
    case "OPEN_AT": {
      // Identity-preserving when the resolved (trigger, query) already
      // matches state. Mirrors HIGHLIGHT_AT's no-op contract so that
      // referential-equality consumers don't re-render on every keystroke
      // that lands inside an already-active mention.
      if (
        state.phase === "open" &&
        state.trigger === action.trigger &&
        state.query === action.query
      ) {
        return state;
      }
      return {
        ...state,
        phase: "open",
        trigger: action.trigger,
        query: action.query,
        // Reset highlight to the first item when the query changes — same
        // behavior ITEMS_CHANGED implements when items refresh.
        highlightedIndex: state.itemCount > 0 ? 0 : -1,
      };
    }
    case "DISMISS":
    case "COMMIT": {
      // Preserve chipSelected across popover-only transitions —
      // dismissing the listbox shouldn't deselect a chip the user is
      // about to delete.
      if (state.phase === "closed" && state.chipSelected === null) return state;
      return { ...CLOSED, chipSelected: state.chipSelected };
    }
    case "CHIP_SELECT": {
      if (state.chipSelected === action.id) return state;
      // Selecting a chip closes any open popover (mutually exclusive UI).
      return { ...CLOSED_BASE, chipSelected: action.id };
    }
    case "CHIP_DESELECT": {
      if (state.chipSelected === null) return state;
      return { ...state, chipSelected: null };
    }
  }
}
