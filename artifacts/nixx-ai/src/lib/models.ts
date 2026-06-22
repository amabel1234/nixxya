export interface AIModel {
  id: string;
  label: string;
  emoji: string;
  badge: string;
  group: string;
  off?: boolean;
}

export const AI_MODELS: AIModel[] = [
  // === Nixx ===
  { id: "deepseekv3", label: "Nixx AI",        emoji: "🧠", badge: "Unggulan", group: "Nixx"        },
  { id: "christyai",  label: "Christy AI",      emoji: "⭐", badge: "JKT48",    group: "Nixx"        },
  // === GPT ===
  { id: "gpt4o",      label: "GPT-4o",          emoji: "🤖", badge: "4o",       group: "GPT"         },
  { id: "gpt3",       label: "GPT-3",           emoji: "🤖", badge: "OpenAI",   group: "GPT"         },
  { id: "copilot",    label: "Copilot AI",      emoji: "🤖", badge: "Microsoft", group: "GPT"        },
  // === Gemini ===
  { id: "gemini25v1", label: "Gemini 2.5 v1",   emoji: "💎", badge: "Flash",    group: "Gemini"      },
  { id: "gemini25v2", label: "Gemini 2.5 v2",   emoji: "💎", badge: "Flash",    group: "Gemini"      },
  // === Grok ===
  { id: "grok4fast",  label: "Grok 4 Fast",     emoji: "⚡", badge: "Kilat",    group: "Grok"        },
  { id: "grok3mini",  label: "Grok 3 Mini",     emoji: "⚡", badge: "Mini",     group: "Grok"        },
  { id: "grok3jail1", label: "Grok Jail v1",    emoji: "🔓", badge: "JB",       group: "Grok"        },
  { id: "grok3jail2", label: "Grok Jail v2",    emoji: "🔓", badge: "JB",       group: "Grok"        },
  // === Open Source ===
  { id: "llama4",     label: "Llama-4 Scout",   emoji: "💻", badge: "17B",      group: "Open Source" },
  { id: "llama33",    label: "Llama-3.3",       emoji: "🌿", badge: "70B",      group: "Open Source" },
  { id: "gemma",      label: "Gemma 7B",        emoji: "💎", badge: "Ringan",   group: "Open Source" },
  { id: "mistral",    label: "Mistral 7B",      emoji: "🌬️", badge: "v0.1",    group: "Open Source" },
  { id: "groqmini",   label: "Groq Mini",       emoji: "⚡", badge: "Cepat",    group: "Open Source" },
  // === Lainnya ===
  { id: "felo",       label: "Felo AI",         emoji: "🔍", badge: "Baru",     group: "Lainnya"     },
  { id: "turboseek",  label: "Turboseek AI",    emoji: "🚀", badge: "Cepat",    group: "Lainnya"     },
  { id: "perplexity", label: "Perplexity AI",   emoji: "🔍", badge: "Web",      group: "Lainnya"     },
  { id: "ripple",     label: "Ripple AI",       emoji: "🌊", badge: "OFF",      group: "Lainnya", off: true },
  { id: "muslim",     label: "Muslim AI",       emoji: "🕌", badge: "Islami",   group: "Lainnya"     },
  { id: "aoyo",       label: "Aoyo AI",         emoji: "💬", badge: "Baru",     group: "Lainnya"     },
  { id: "venice",     label: "Venice AI",       emoji: "🌊", badge: "Baru",     group: "Lainnya"     },
  { id: "gptoss120",  label: "GPT-OSS 120B",    emoji: "💻", badge: "120B",     group: "Lainnya"     },
  { id: "gptoss20",   label: "GPT-OSS 20B",     emoji: "💻", badge: "20B",      group: "Lainnya"     },
  { id: "perplexed",  label: "Perplexed AI",    emoji: "❓", badge: "Canggih",  group: "Lainnya"     },
];

export const getModelById = (id: string): AIModel =>
  AI_MODELS.find((m) => m.id === id) ?? AI_MODELS[0];
