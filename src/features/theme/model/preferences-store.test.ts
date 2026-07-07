import { act } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  DEFAULT_PREFERENCES,
  usePreferencesStore,
} from "./preferences-store";

const root = () => document.documentElement;

describe("preferences store", () => {
  afterEach(() => {
    act(() => usePreferencesStore.getState().reset());
    localStorage.clear();
  });

  it("applies data-preset on <html> when a non-default preset is chosen", () => {
    act(() => usePreferencesStore.getState().setPreset("blue"));
    expect(root().getAttribute("data-preset")).toBe("blue");
  });

  it("removes the attribute again for the default value", () => {
    act(() => usePreferencesStore.getState().setPreset("blue"));
    act(() => usePreferencesStore.getState().setPreset(DEFAULT_PREFERENCES.preset));
    expect(root().hasAttribute("data-preset")).toBe(false);
  });

  it("applies radius and density attributes independently", () => {
    act(() => {
      usePreferencesStore.getState().setRadius("none");
      usePreferencesStore.getState().setDensity("compact");
    });
    expect(root().getAttribute("data-radius")).toBe("none");
    expect(root().getAttribute("data-density")).toBe("compact");
  });

  it("reset clears every attribute and restores defaults", () => {
    act(() => {
      usePreferencesStore.getState().setPreset("rose");
      usePreferencesStore.getState().setRadius("xl");
      usePreferencesStore.getState().setDensity("spacious");
    });
    act(() => usePreferencesStore.getState().reset());

    expect(root().hasAttribute("data-preset")).toBe(false);
    expect(root().hasAttribute("data-radius")).toBe(false);
    expect(root().hasAttribute("data-density")).toBe(false);
    expect(usePreferencesStore.getState().preset).toBe(DEFAULT_PREFERENCES.preset);
  });

  it("persists preferences to localStorage under the key the no-flash script reads", () => {
    act(() => usePreferencesStore.getState().setPreset("green"));
    const persisted = JSON.parse(localStorage.getItem("ui-preferences") ?? "{}");
    expect(persisted.state.preset).toBe("green");
  });
});
