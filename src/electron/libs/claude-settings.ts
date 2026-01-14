import type { ClaudeSettingsEnv } from "../types.js";
import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CLAUDE_SETTINGS_ENV_KEYS = [
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_MODEL",
  "API_TIMEOUT_MS",
  "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC"
] as const;

export function loadClaudeSettingsEnv(): ClaudeSettingsEnv {
  try {
    const settingsPath = join(homedir(), ".claude", "settings.json");
    const raw = readFileSync(settingsPath, "utf8");
    const parsed = JSON.parse(raw) as { env?: Record<string, unknown> };
    if (parsed.env) {
      for (const [key, value] of Object.entries(parsed.env)) {
        // Settings.json env vars override process.env (reversed priority)
        if (value !== undefined && value !== null) {
          process.env[key] = String(value);
        }
      }
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }

  const env = {} as ClaudeSettingsEnv;
  for (const key of CLAUDE_SETTINGS_ENV_KEYS) {
    env[key] = process.env[key] ?? "";
  }
  return env;
}

export const claudeCodeEnv = loadClaudeSettingsEnv();
