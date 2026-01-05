import { useState, useEffect } from 'react'
import { getSubscriptions } from '../utils/storage'
import { getSubscriptionsByDate, getSubscriptionsExpiringInRange, formatDateArabic, getDaysRemaining } from '../utils/dateUtils'
import ServiceIcon from './ServiceIcon'
import ProgressRing from './ProgressRing'
import CopyButton from './CopyButton'

function Renewals() {
  const [subscriptions, setSubscriptions] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState('date') // date or range
  const [rangeStart, setRangeStart] = useState(new Date().toISOString().split('T')[0])
  const [rangeEnd, setRangeEnd] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

  useEffect(() => {
    loadSubscriptions()
    const interval = setInterval(loadSubscriptions, 1000)
    return () => clearInterval(interval)
  }, [])

  const loadSubscriptions = async () => {
    const subs = await getSubscriptions()
    setSubscriptions(subs)
  }

  const getFilteredSubscriptions = () => {
    if (viewMode === 'date') {
      return getSubscriptionsByDate(subscriptions, selectedDate)
    } else {
      return getSubscriptionsExpiringInRange(subscriptions, rangeStart, rangeEnd)
    }
  }

  const filteredSubscriptions = getFilteredSubscriptions()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white font-arabic mb-2">⏰ الاشتراكات القادمة للتجديد</h1>
        <p className="text-gray-400 font-arabic">عرض الاشتراكات التي تحتاج إلى تجديد</p>
      </div>

      <div className="glass-card rounded-2xl p-6 mb-6 border border-white/10">
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={() => setViewMode('date')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 font-arabic ${
              viewMode === 'date' 
                ? 'btn-premium text-white' 
                : 'glass-card-light text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            📅 حسب تاريخ محدد
          </button>
          <button
            onClick={() => setViewMode('range')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 font-arabic ${
              viewMode === 'range' 
                ? 'btn-premium text-white' 
                : 'glass-card-light text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            📊 حسب نطاق زمني
          </button>
        </div>

        {viewMode === 'date' ? (
          <div>
            <label htmlFor="selectedDate" className="block text-sm font-medium text-gray-300 mb-2 font-arabic">
              اختر التاريخ
            </label>
            <input
              type="date"
              id="selectedDate"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full md:w-auto px-4 py-3 glass-card-light border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-premium-blue focus:border-premium-blue outline-none font-arabic"
            />
            <p className="mt-2 text-sm text-gray-400 font-arabic">
              الاشتراكات التي تنتهي في: {formatDateArabic(selectedDate)}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rangeStart" className="block text-sm font-medium text-gray-300 mb-2 font-arabic">
                من تاريخ
              </label>
              <input
                type="date"
                id="rangeStart"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="w-full px-4 py-3 glass-card-light border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-premium-blue focus:border-premium-blue outline-none font-arabic"
              />
            </div>
            <div>
              <label htmlFor="rangeEnd" className="block text-sm font-medium text-gray-300 mb-2 font-arabic">
                إلى تاريخ
              </label>
              <input
                type="date"
                id="rangeEnd"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="w-full px-4 py-3 glass-card-light border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-premium-blue focus:border-premium-blue outline-none font-arabic"
              />
            </div>
            <p className="md:col-span-2 mt-2 text-sm text-gray-400 font-arabic">
              الاشتراكات التي تنتهي بين {formatDateArabic(rangeStart)} و {formatDateArabic(rangeEnd)}
            </p>
          </div>
        )}
      </div>

      {filteredSubscriptions.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-white/10">
          <p className="text-gray-400 text-lg font-arabic">
            {viewMode === 'date' 
              ? `لا توجد اشتراكات تنتهي في ${formatDateArabic(selectedDate)}`
              : `لا توجد اشتراكات تنتهي في النطاق المحدد`
            }
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <div className="glass-card-light px-6 py-3 rounded-xl border border-premium-blue/30 inline-block">
              <p className="text-lg font-semibold text-white font-arabic">
                عدد الاشتراكات: <span className="text-premium-gold">{filteredSubscriptions.length}</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubscriptions.map((subscription) => {
              const daysRemaining = getDaysRemaining(subscription.endDate)
              const startDate = new Date(subscription.startDate)
              const endDate = new Date(subscription.endDate)
              const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
              const progressPercentage = daysRemaining > 0 ? (daysRemaining / totalDays) * 100 : 0
              
              const subscriptionData = `العميل: ${subscription.personName}\nالخدمة: ${subscription.subscriptionName}\nالنوع: ${subscription.category || 'غير محدد'}\nتاريخ البداية: ${formatDateArabic(subscription.startDate)}\nتاريخ الانتهاء: ${formatDateArabic(subscription.endDate)}\nالمدة المتبقية: ${daysRemaining > 0 ? `${daysRemaining} يوم` : 'منتهي'}`
              
              return (
                <div
                  key={subscription.id}
                  className="glass-card rounded-2xl p-6 border border-red-500/30 hover:border-red-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <ServiceIcon serviceName={subscription.subscriptionName || subscription.category} />
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg font-arabic mb-1">
                          {subscription.personName}
                        </h3>
                        <p className="text-gray-300 text-sm font-arabic">{subscription.subscriptionName}</p>
                        {subscription.category && (
                          <span className="inline-block glass-card-light px-2 py-1 rounded text-xs font-medium text-premium-gold border border-premium-gold/30 font-arabic mt-1">
                            {subscription.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <CopyButton text={subscriptionData} label="نسخ" />
                  </div>

                  <div className="flex items-center justify-center my-4">
                    <ProgressRing 
                      percentage={Math.max(0, Math.min(100, progressPercentage))} 
                      daysRemaining={daysRemaining > 0 ? daysRemaining : 0}
                    />
                  </div>

                  <div className="space-y-2 mb-4 glass-card-light rounded-xl p-4 border border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm font-arabic">تاريخ البداية:</span>
                      <span className="text-white font-medium text-sm font-arabic">{formatDateArabic(subscription.startDate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm font-arabic">تاريخ الانتهاء:</span>
                      <span className="font-medium text-red-400 text-sm font-arabic">{formatDateArabic(subscription.endDate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm font-arabic">المدة:</span>
                      <span className="text-white font-medium text-sm font-arabic">
                        {subscription.duration === 'month' && 'شهر واحد'}
                        {subscription.duration === '3months' && '3 أشهر'}
                        {subscription.duration === '6months' && '6 أشهر'}
                        {subscription.duration === 'year' && 'سنة واحدة'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-gray-400 font-semibold text-sm font-arabic">المتبقي:</span>
                      {daysRemaining < 0 ? (
                        <span className="text-red-400 font-bold text-sm font-arabic">منتهي منذ {Math.abs(daysRemaining)} يوم</span>
                      ) : daysRemaining === 0 ? (
                        <span className="text-red-400 font-bold text-sm font-arabic">ينتهي اليوم!</span>
                      ) : (
                        <span className="text-premium-gold font-bold text-sm font-arabic">متبقي {daysRemaining} يوم</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Renewals

