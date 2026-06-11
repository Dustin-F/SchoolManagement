/** Curated emojis for behaviour / merit skills (ClassDojo-style). */
export const SKILL_EMOJI_GROUPS = [
  {
    label: "Praise & teamwork",
    emojis: ["👏", "🤝", "✅", "⭐", "🌟", "💜", "❤️", "👍", "🙌", "🏆", "🎉", "✨", "🔥", "🦸"],
  },
  {
    label: "Learning",
    emojis: ["💡", "🎯", "📚", "✏️", "📝", "🧠", "🎨", "🧩", "🔬", "🌈", "📋", "🎒"],
  },
  {
    label: "Reminders",
    emojis: ["💬", "📵", "⏰", "⚠️", "🚫", "😴", "🗣️", "📱", "🏃", "💤", "🤫", "🙉", "🧹", "🤔"],
  },
] as const;

export const SKILL_EMOJI_OPTIONS = SKILL_EMOJI_GROUPS.flatMap((group) => [...group.emojis]);
