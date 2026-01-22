export default function ProgressRing({ percentage, size = 60, strokeWidth = 6, daysRemaining, endDate, getDaysRemainingText }) {
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

  // تحديد النص المعروض
  let displayNumber = daysRemaining
  let displayLabel = 'يوم'
  
  if (endDate && getDaysRemainingText) {
    const text = getDaysRemainingText(endDate)
    if (text.includes('منتهي منذ')) {
      // استخراج الرقم من النص
      if (text === 'منتهي منذ يوم') {
        displayNumber = '1'
        displayLabel = 'منذ يوم'
      } else {
        // منتهي منذ X يوم
        const match = text.match(/(\d+)/)
        if (match) {
          displayNumber = match[1]
          displayLabel = 'منذ أيام'
        }
      }
    } else if (text === '0 يوم') {
      displayNumber = '0'
      displayLabel = 'يوم'
    } else {
      // متبقي X يوم
      const match = text.match(/(\d+)/)
      if (match) {
        displayNumber = match[1]
        displayLabel = 'يوم'
      }
    }
  } else {
    // Fallback: إذا لم يتم تمرير الدالة، استخدم القيمة المباشرة
    if (daysRemaining < 0) {
      displayNumber = Math.abs(daysRemaining)
      displayLabel = daysRemaining === -1 ? 'منذ يوم' : 'منذ أيام'
    } else if (daysRemaining === 0) {
      displayNumber = '0'
      displayLabel = 'يوم'
    } else {
      displayNumber = daysRemaining
      displayLabel = 'يوم'
    }
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
          <div className="text-white font-bold text-sm font-arabic">{displayNumber}</div>
          <div className="text-gray-400 text-xs font-arabic">{displayLabel}</div>
        </div>
      </div>
    </div>
  )
}

