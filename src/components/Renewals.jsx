import { useState, useEffect } from 'react'
import { getSubscriptions } from '../utils/storage'
import { getSubscriptionsByDate, getSubscriptionsExpiringInRange, formatDateArabic, getDaysRemaining } from '../utils/dateUtils'

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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">الاشتراكات القادمة للتجديد</h1>
        <p className="text-gray-600">عرض الاشتراكات التي تحتاج إلى تجديد</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={() => setViewMode('date')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'date' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            حسب تاريخ محدد
          </button>
          <button
            onClick={() => setViewMode('range')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'range' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            حسب نطاق زمني
          </button>
        </div>

        {viewMode === 'date' ? (
          <div>
            <label htmlFor="selectedDate" className="block text-sm font-medium text-gray-700 mb-2">
              اختر التاريخ
            </label>
            <input
              type="date"
              id="selectedDate"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <p className="mt-2 text-sm text-gray-600">
              الاشتراكات التي تنتهي في: {formatDateArabic(selectedDate)}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rangeStart" className="block text-sm font-medium text-gray-700 mb-2">
                من تاريخ
              </label>
              <input
                type="date"
                id="rangeStart"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label htmlFor="rangeEnd" className="block text-sm font-medium text-gray-700 mb-2">
                إلى تاريخ
              </label>
              <input
                type="date"
                id="rangeEnd"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <p className="md:col-span-2 mt-2 text-sm text-gray-600">
              الاشتراكات التي تنتهي بين {formatDateArabic(rangeStart)} و {formatDateArabic(rangeEnd)}
            </p>
          </div>
        )}
      </div>

      {filteredSubscriptions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-gray-500 text-lg">
            {viewMode === 'date' 
              ? `لا توجد اشتراكات تنتهي في ${formatDateArabic(selectedDate)}`
              : `لا توجد اشتراكات تنتهي في النطاق المحدد`
            }
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <p className="text-lg font-semibold text-gray-700">
              عدد الاشتراكات: <span className="text-indigo-600">{filteredSubscriptions.length}</span>
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubscriptions.map((subscription) => {
              const daysRemaining = getDaysRemaining(subscription.endDate)
              return (
                <div
                  key={subscription.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-r-4 border-indigo-500"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {subscription.personName}
                    </h3>
                    <p className="text-gray-600 text-sm">{subscription.subscriptionName}</p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">تاريخ البداية:</span>
                      <span className="font-medium">{formatDateArabic(subscription.startDate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">تاريخ الانتهاء:</span>
                      <span className="font-medium text-red-600">{formatDateArabic(subscription.endDate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">المدة:</span>
                      <span className="font-medium">
                        {subscription.duration === 'month' && 'شهر'}
                        {subscription.duration === '3months' && '3 أشهر'}
                        {subscription.duration === '6months' && '6 أشهر'}
                        {subscription.duration === 'year' && 'سنة'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-gray-600 font-semibold">المتبقي:</span>
                      {daysRemaining < 0 ? (
                        <span className="text-red-600 font-bold">منتهي منذ {Math.abs(daysRemaining)} يوم</span>
                      ) : daysRemaining === 0 ? (
                        <span className="text-red-600 font-bold">ينتهي اليوم!</span>
                      ) : (
                        <span className="text-indigo-600 font-bold">متبقي {daysRemaining} يوم</span>
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

