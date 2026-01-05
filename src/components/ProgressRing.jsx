export default function ProgressRing({ percentage, size = 60, strokeWidth = 6, daysRemaining }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  // تحديد اللون حسب النسبة
  let strokeColor = '#10B981' // أخضر
  if (percentage < 25) {
    strokeColor = '#EF4444' // أحمر
  } else if (percentage < 50) {
    strokeColor = '#F59E0B' // برتقالي
  } else if (percentage < 75) {
    strokeColor = '#FCD34D' // أصفر
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="progress-ring"
        width={size}
        height={size}
      >
        {/* الخلفية */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* التقدم */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      {/* النص في المنتصف */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white font-bold text-sm font-arabic">{daysRemaining}</div>
          <div className="text-gray-400 text-xs font-arabic">يوم</div>
        </div>
      </div>
    </div>
  )
}

