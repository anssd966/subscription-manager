import { useState, useEffect } from 'react'
import { getSubscriptions } from '../utils/storage'
import { getDaysRemaining, isExpiringSoon } from '../utils/dateUtils'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const loadNotifications = async () => {
      const subs = await getSubscriptions()
      const expiring = subs.filter(sub => {
        const days = getDaysRemaining(sub.endDate)
        return days > 0 && days <= 7 && !isExpiringSoon(sub.endDate, 0)
      })
      
      const notificationsList = expiring.map(sub => ({
        id: sub.id,
        message: `بقي ${getDaysRemaining(sub.endDate)} يوم على انتهاء اشتراك ${sub.personName} - ${sub.subscriptionName}`,
        days: getDaysRemaining(sub.endDate),
        subscription: sub
      }))
      
      setNotifications(notificationsList.sort((a, b) => a.days - b.days))
    }

    loadNotifications()
    const interval = setInterval(loadNotifications, 60000) // تحديث كل دقيقة
    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.length

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          ></div>
          <div className="absolute left-0 mt-2 w-80 glass-card rounded-xl shadow-2xl z-50 border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-bold text-lg font-arabic">التنبيهات</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400 font-arabic">
                  لا توجد تنبيهات
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 border-b border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        notif.days <= 3 ? 'bg-red-500' : 
                        notif.days <= 5 ? 'bg-yellow-500' : 
                        'bg-premium-blue'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-arabic">{notif.message}</p>
                        <p className="text-gray-400 text-xs mt-1 font-arabic">
                          {notif.subscription.category}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

