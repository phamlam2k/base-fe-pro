"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { WizardData } from "./schemas";

/**
 * Wizard draft persisted to localStorage — users can leave mid-flow and
 * resume where they stopped. `reset()` after successful submission.
 */
export const WIZARD_STEPS = ["basics", "audience", "review"] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

const EMPTY_DRAFT: WizardData = {
  name: "",
  objective: "awareness",
  locations: [],
  dailyBudget: Number.NaN,
  terms: false,
};

interface WizardState {
  step: WizardStep;
  draft: WizardData;
  setStep: (step: WizardStep) => void;
  patchDraft: (partial: Partial<WizardData>) => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      step: "basics",
      draft: EMPTY_DRAFT,
      setStep: (step) => set({ step }),
      patchDraft: (partial) =>
        set((state) => ({ draft: { ...state.draft, ...partial } })),
      reset: () => set({ step: "basics", draft: { ...EMPTY_DRAFT } }),
    }),
    {
      name: "campaign-wizard-draft",
      // NaN serializes to null in JSON; restore it so validation still says "required".
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<WizardState>) };
        if (merged.draft.dailyBudget === null) {
          merged.draft = { ...merged.draft, dailyBudget: Number.NaN };
        }
        return merged;
      },
    },
  ),
);
