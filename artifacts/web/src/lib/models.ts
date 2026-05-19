export interface AIModel {
  id: string;
  label: string;
  emoji: string;
  badge: string;
  group: string;
  actualModel: string;
}

export const AI_MODELS: AIModel[] = [
  { id: "gpt-5.4", label: "GPT-5.4", emoji: "🤖", badge: "Terbaru", group: "GPT-5", actualModel: "gpt-5.4" },
  { id: "gpt-5.2", label: "GPT-5.2", emoji: "🤖", badge: "Cepat", group: "GPT-5", actualModel: "gpt-5.2" },
  { id: "gpt-5", label: "GPT-5", emoji: "🤖", badge: "Stabil", group: "GPT-5", actualModel: "gpt-5" },
  { id: "gpt-5-mini", label: "GPT-5 Mini", emoji: "⚡", badge: "Mini", group: "GPT-5", actualModel: "gpt-5-mini" },
  { id: "gpt-5-nano", label: "GPT-5 Nano", emoji: "⚡", badge: "Nano", group: "GPT-5", actualModel: "gpt-5-nano" },
  { id: "o4-mini", label: "o4 Mini", emoji: "🧠", badge: "Reasoning", group: "Reasoning", actualModel: "o4-mini" },
  { id: "o3", label: "o3 Advanced", emoji: "🧠", badge: "Pro", group: "Reasoning", actualModel: "o3" },
  { id: "gpt-4o", label: "GPT-4o", emoji: "🤖", badge: "4o", group: "GPT-4", actualModel: "gpt-4o" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", emoji: "⚡", badge: "Mini", group: "GPT-4", actualModel: "gpt-4o-mini" },
  { id: "gpt-5.3-codex", label: "GPT Codex", emoji: "💻", badge: "Coding", group: "Code", actualModel: "gpt-5.3-codex" },
  { id: "claude-3-7-sonnet", label: "Claude 3.7 Sonnet", emoji: "🎭", badge: "Sonnet", group: "Claude", actualModel: "gpt-5.4" },
  { id: "claude-opus-4", label: "Claude Opus 4", emoji: "🎭", badge: "Opus", group: "Claude", actualModel: "gpt-5.4" },
  { id: "claude-3-5-haiku", label: "Claude 3.5 Haiku", emoji: "🎭", badge: "Haiku", group: "Claude", actualModel: "gpt-5-mini" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", emoji: "💎", badge: "Pro", group: "Gemini", actualModel: "gpt-5.4" },
  { id: "gemini-2.5-v1", label: "Gemini 2.5 v1", emoji: "💎", badge: "Flash", group: "Gemini", actualModel: "gpt-5-mini" },
  { id: "gemini-2.5-v2", label: "Gemini 2.5 v2", emoji: "💎", badge: "Flash", group: "Gemini", actualModel: "gpt-5.2" },
  { id: "grok-4-fast", label: "Grok 4 Fast", emoji: "⚡", badge: "Kilat", group: "Grok", actualModel: "gpt-5.4" },
  { id: "grok-3-mini", label: "Grok 3 Mini", emoji: "⚡", badge: "Mini", group: "Grok", actualModel: "gpt-5-mini" },
  { id: "grok-jail-v1", label: "Grok Jail v1", emoji: "🔓", badge: "JB", group: "Grok", actualModel: "gpt-5.2" },
  { id: "grok-jail-v2", label: "Grok Jail v2", emoji: "🔓", badge: "JB", group: "Grok", actualModel: "gpt-5.4" },
  { id: "gpt-oss-20b", label: "GPT-OSS 20B", emoji: "💻", badge: "20B", group: "Open Source", actualModel: "gpt-5.2" },
  { id: "llama-3.3-70b", label: "Llama 3.3 70B", emoji: "🦙", badge: "70B", group: "Open Source", actualModel: "gpt-5.2" },
  { id: "llama-3.1-405b", label: "Llama 3.1 405B", emoji: "🦙", badge: "405B", group: "Open Source", actualModel: "gpt-5.4" },
  { id: "mistral-large", label: "Mistral Large", emoji: "🌊", badge: "Large", group: "Open Source", actualModel: "gpt-5.2" },
  { id: "deepseek-r1", label: "DeepSeek R1", emoji: "🔍", badge: "R1", group: "Open Source", actualModel: "o3" },
  { id: "venice-ai", label: "Venice AI", emoji: "🌊", badge: "Baru", group: "Lainnya", actualModel: "gpt-5-mini" },
];

export const getModelById = (id: string): AIModel => AI_MODELS.find((m) => m.id === id) || AI_MODELS[0];
