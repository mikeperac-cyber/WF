import { DEFAULT_AI_CONFIG, type AiConfig } from "@/services/aiService";
import type { SettingsSlice, SliceCreator } from "./types";

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage may be disabled; settings just won't persist */
  }
}

const savedTheme = (safeGet("wf_theme") as "dark" | "light" | null) || "dark";

const savedAiConfig: AiConfig = (() => {
  try {
    const raw = safeGet("wf_ai_config");
    return raw ? { ...DEFAULT_AI_CONFIG, ...JSON.parse(raw) } : DEFAULT_AI_CONFIG;
  } catch {
    return DEFAULT_AI_CONFIG;
  }
})();

export const createSettingsSlice: SliceCreator<SettingsSlice> = (set, get) => ({
  theme: savedTheme,
  aiConfig: savedAiConfig,

  toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),

  setTheme: (theme) => {
    safeSet("wf_theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    set({ theme });
  },

  updateAiConfig: (patch) => {
    const next = { ...get().aiConfig, ...patch };
    safeSet("wf_ai_config", JSON.stringify(next));
    set({ aiConfig: next });
    get().pushLog(
      "info",
      `AI settings updated (provider: ${next.provider}, model: ${next.model})`
    );
  },
});
