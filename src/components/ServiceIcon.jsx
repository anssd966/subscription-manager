// أيقونات الخدمات الشائعة
const serviceIcons = {
  'netflix': '🎬',
  'chatgpt': '🤖',
  'canva': '🎨',
  'spotify': '🎵',
  'youtube': '📺',
  'adobe': '🖼️',
  'microsoft': '💼',
  'google': '🔍',
  'amazon': '📦',
  'disney': '🏰',
  'hulu': '📡',
  'hbo': '🎭',
  'apple': '🍎',
  'duolingo': '🦉',
  'perplexity': '💡',
  'gemini': '⭐',
  'capcut': '✂️',
}

export default function ServiceIcon({ serviceName }) {
  const normalizedName = serviceName?.toLowerCase() || ''
  
  // البحث في اسم الخدمة
  for (const [key, icon] of Object.entries(serviceIcons)) {
    if (normalizedName.includes(key)) {
      return (
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-premium-blue/20 to-premium-gold/20 flex items-center justify-center text-2xl border border-white/10">
          {icon}
        </div>
      )
    }
  }
  
  // أيقونة افتراضية
  return (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-premium-blue/20 to-premium-gold/20 flex items-center justify-center text-xl border border-white/10">
      <span className="text-premium-gold font-bold">P</span>
    </div>
  )
}

