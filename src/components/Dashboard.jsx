import { useState, useEffect } from 'react'
import { getSubscriptions, deleteSubscription, updateSubscription, subscribeToSubscriptions } from '../utils/storage'
import { getDaysRemaining, formatDateArabic, isExpired, isExpiringSoon, calculateEndDate } from '../utils/dateUtils'
import { Link } from 'react-router-dom'
import ServiceIcon from './ServiceIcon'
import ProgressRing from './ProgressRing'
import CopyButton from './CopyButton'
import NotificationBell from './NotificationBell'

function Dashboard() {
  const [subscriptions, setSubscriptions] = useState([])
  const [filter, setFilter] = useState('all') // all, active, expired, expiring
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editFormData, setEditFormData] = useState({
    personName: '',
    subscriptionName: '',
    category: '',
    startDate: '',
    duration: 'month'
  })

  useEffect(() => {
    // استخدام الاستماع الفوري من Firebase
    const unsubscribe = subscribeToSubscriptions((subs) => {
      setSubscriptions(subs.sort((a, b) => new Date(a.endDate) - new Date(b.endDate)))
    })
    
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const loadSubscriptions = async () => {
    const subs = await getSubscriptions()
    setSubscriptions(subs.sort((a, b) => new Date(a.endDate) - new Date(b.endDate)))
  }



  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الاشتراك؟')) {
      await deleteSubscription(id)
      loadSubscriptions()
    }
  }

  const handleEdit = (subscription) => {
    setEditingId(subscription.id)
    setEditFormData({
      personName: subscription.personName,
      subscriptionName: subscription.subscriptionName,
      category: subscription.category || '',
      startDate: subscription.startDate,
      duration: subscription.duration
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditFormData({
      personName: '',
      subscriptionName: '',
      category: '',
      startDate: '',
      duration: 'month'
    })
  }

  const handleSaveEdit = async (id) => {
    if (!editFormData.personName.trim() || !editFormData.subscriptionName.trim() || !editFormData.category.trim()) {
      alert('يرجى ملء جميع الحقول')
      return
    }

    const endDate = calculateEndDate(editFormData.startDate, editFormData.duration)
    
    await updateSubscription(id, {
      ...editFormData,
      endDate
    })

    alert('تم تحديث الاشتراك بنجاح!')
    setEditingId(null)
    loadSubscriptions()
  }

  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    })
  }

  const getSubscriptionsByDuration = (duration) => {
    return subscriptions.filter(sub => sub.duration === duration)
  }

  const filterSubscriptions = (subs) => {
    let filtered = subs

    // Filter by status
    filtered = filtered.filter(sub => {
      const daysRemaining = getDaysRemaining(sub.endDate)
      const expired = isExpired(sub.endDate)
      const expiring = isExpiringSoon(sub.endDate, 7)

      if (filter === 'active') return !expired
      if (filter === 'expired') return expired
      if (filter === 'expiring') return expiring && !expired
      return true
    })

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(sub => sub.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(sub => 
        sub.personName.toLowerCase().includes(query) ||
        sub.subscriptionName.toLowerCase().includes(query) ||
        (sub.category && sub.category.toLowerCase().includes(query))
      )
    }

    return filtered
  }

  const getAllCategories = () => {
    const categories = new Set()
    subscriptions.forEach(sub => {
      if (sub.category) {
        categories.add(sub.category)
      }
    })
    return Array.from(categories).sort()
  }

  const getStatusBadge = (endDate) => {
    const daysRemaining = getDaysRemaining(endDate)
    const expired = isExpired(endDate)
    const expiring = isExpiringSoon(endDate, 7)

    if (expired) {
      return (
        <span className="glass-card-light px-3 py-1.5 rounded-lg text-xs font-bold font-arabic border border-red-500/50 text-red-400">
          ⛔ منتهي
        </span>
      )
    } else if (expiring) {
      return (
        <span className="glass-card-light px-3 py-1.5 rounded-lg text-xs font-bold font-arabic border border-yellow-500/50 text-yellow-400">
          ⚠️ قريباً
        </span>
      )
    } else {
      return (
        <span className="glass-card-light px-3 py-1.5 rounded-lg text-xs font-bold font-arabic border border-green-500/50 text-green-400">
          ✅ نشط
        </span>
      )
    }
  }

  const getDaysRemainingBadge = (endDate) => {
    const days = getDaysRemaining(endDate)
    if (days < 0) {
      return <span className="text-red-600 font-bold">منتهي منذ {Math.abs(days)} يوم</span>
    } else if (days === 0) {
      return <span className="text-red-600 font-bold">ينتهي اليوم!</span>
    } else if (days <= 7) {
      return <span className="text-yellow-600 font-bold">متبقي {days} يوم</span>
    } else {
      return <span className="text-gray-700">متبقي {days} يوم</span>
    }
  }

  const durations = [
    { value: 'month', label: 'شهر واحد' },
    { value: '3months', label: '3 أشهر' },
    { value: '6months', label: '6 أشهر' },
    { value: 'year', label: 'سنة واحدة' }
  ]

  const filteredSubscriptions = filterSubscriptions(subscriptions)

  // حساب الإحصائيات
  const activeSubs = subscriptions.filter(sub => !isExpired(sub.endDate))
  const expiringSubs = subscriptions.filter(sub => isExpiringSoon(sub.endDate, 7) && !isExpired(sub.endDate))
  const expiredSubs = subscriptions.filter(sub => isExpired(sub.endDate))
  const totalValue = activeSubs.length // يمكن حساب قيمة مالية لاحقاً

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Summary Cards - Premium Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-premium-blue/30 glow-blue">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-premium-blue to-premium-blue/50 flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-premium-gold text-xl sm:text-2xl font-bold font-arabic">{activeSubs.length}</span>
          </div>
          <h3 className="text-white font-bold text-base sm:text-lg font-arabic mb-1">الاشتراكات النشطة</h3>
          <p className="text-gray-400 text-xs sm:text-sm font-arabic">رصيدك الحالي</p>
        </div>

        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-yellow-500/30">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-yellow-400 text-xl sm:text-2xl font-bold font-arabic">{expiringSubs.length}</span>
          </div>
          <h3 className="text-white font-bold text-base sm:text-lg font-arabic mb-1">قريبة من الانتهاء</h3>
          <p className="text-gray-400 text-xs sm:text-sm font-arabic">تحتاج تجديد</p>
        </div>

        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-red-500/30">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="text-red-400 text-xl sm:text-2xl font-bold font-arabic">{expiredSubs.length}</span>
          </div>
          <h3 className="text-white font-bold text-base sm:text-lg font-arabic mb-1">الاشتراكات المنتهية</h3>
          <p className="text-gray-400 text-xs sm:text-sm font-arabic">انتهت صلاحيتها</p>
        </div>

        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-premium-gold/30 glow-gold">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-premium-gold to-yellow-400 flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-premium-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-premium-gold text-xl sm:text-2xl font-bold font-arabic">{subscriptions.length}</span>
          </div>
          <h3 className="text-white font-bold text-base sm:text-lg font-arabic mb-1">إجمالي الاشتراكات</h3>
          <p className="text-gray-400 text-xs sm:text-sm font-arabic">جميع العملاء</p>
        </div>
      </div>

      {/* Filters - Premium Design */}
      <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-white/10">
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-base font-medium transition-all duration-300 font-arabic ${
              filter === 'all' 
                ? 'btn-premium text-white' 
                : 'glass-card-light text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            الكل ({subscriptions.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-base font-medium transition-all duration-300 font-arabic ${
              filter === 'active' 
                ? 'btn-premium text-white' 
                : 'glass-card-light text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            النشطة ({activeSubs.length})
          </button>
          <button
            onClick={() => setFilter('expiring')}
            className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-base font-medium transition-all duration-300 font-arabic ${
              filter === 'expiring' 
                ? 'btn-premium text-white' 
                : 'glass-card-light text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="hidden sm:inline">قريبة من الانتهاء</span>
            <span className="sm:hidden">قريبة</span> ({expiringSubs.length})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-base font-medium transition-all duration-300 font-arabic ${
              filter === 'expired' 
                ? 'btn-premium text-white' 
                : 'glass-card-light text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            المنتهية ({expiredSubs.length})
          </button>
        </div>

        {/* Advanced Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label htmlFor="search" className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 font-arabic">
              🔍 البحث
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 glass-card-light border border-white/10 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-400 focus:ring-2 focus:ring-premium-blue focus:border-premium-blue outline-none font-arabic"
              placeholder="ابحث بالاسم أو نوع الاشتراك..."
            />
          </div>
          <div>
            <label htmlFor="categoryFilter" className="block text-xs sm:text-sm font-medium text-gray-300 mb-2 font-arabic">
              📂 التصنيف
            </label>
            <select
              id="categoryFilter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 glass-card-light border border-white/10 rounded-lg sm:rounded-xl text-sm sm:text-base text-white focus:ring-2 focus:ring-premium-blue focus:border-premium-blue outline-none font-arabic"
            >
              <option value="all" className="bg-premium-navy">جميع الأنواع</option>
              {getAllCategories().map(cat => (
                <option key={cat} value={cat} className="bg-premium-navy">{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Link
              to="/add"
              className="w-full btn-premium text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-base font-bold text-center font-arabic"
            >
              ➕ <span className="hidden sm:inline">إضافة اشتراك جديد</span><span className="sm:hidden">إضافة</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Subscriptions by Duration */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white font-arabic mb-4 sm:mb-6">الاشتراكات حسب المدة</h2>
        <div className="space-y-4">
          {durations.map(d => {
            const durationSubs = getSubscriptionsByDuration(d.value)
            const filteredSubs = filterSubscriptions(durationSubs)
            const isExpanded = expandedCategory === d.value

            return (
              <div key={d.value} className="glass-card rounded-2xl overflow-hidden border border-white/10">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : d.value)}
                  className="w-full px-6 py-4 flex justify-between items-center hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-white font-arabic">{d.label}</h3>
                    <span className="glass-card-light px-4 py-1.5 rounded-lg text-sm font-bold text-premium-gold border border-premium-gold/30 font-arabic">
                      {filteredSubs.length} اشتراك
                    </span>
                  </div>
                  <svg
                    className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-6 py-4 border-t border-white/10">
                    {filteredSubs.length === 0 ? (
                      <p className="text-gray-400 text-center py-8 font-arabic">لا توجد اشتراكات في هذه الفئة</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSubs.map((subscription) => {
                          const isEditing = editingId === subscription.id

                          if (isEditing) {
                            return (
                              <div
                                key={subscription.id}
                                className="glass-card rounded-xl p-4 border-2 border-premium-blue/50"
                              >
                                <div className="space-y-3">
                                  <h4 className="text-white font-bold font-arabic mb-3">✏️ تعديل الاشتراك</h4>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1 font-arabic">اسم الشخص</label>
                                    <input
                                      type="text"
                                      name="personName"
                                      value={editFormData.personName}
                                      onChange={handleEditChange}
                                      className="w-full px-3 py-2 glass-card-light border border-white/10 rounded-lg text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-premium-blue outline-none font-arabic"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1 font-arabic">اسم الاشتراك</label>
                                    <input
                                      type="text"
                                      name="subscriptionName"
                                      value={editFormData.subscriptionName}
                                      onChange={handleEditChange}
                                      className="w-full px-3 py-2 glass-card-light border border-white/10 rounded-lg text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-premium-blue outline-none font-arabic"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1 font-arabic">نوع الاشتراك</label>
                                    <input
                                      type="text"
                                      name="category"
                                      value={editFormData.category}
                                      onChange={handleEditChange}
                                      className="w-full px-3 py-2 glass-card-light border border-white/10 rounded-lg text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-premium-blue outline-none font-arabic"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1 font-arabic">تاريخ البداية</label>
                                    <input
                                      type="date"
                                      name="startDate"
                                      value={editFormData.startDate}
                                      onChange={handleEditChange}
                                      className="w-full px-3 py-2 glass-card-light border border-white/10 rounded-lg text-sm text-white focus:ring-2 focus:ring-premium-blue outline-none font-arabic"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1 font-arabic">المدة</label>
                                    <select
                                      name="duration"
                                      value={editFormData.duration}
                                      onChange={handleEditChange}
                                      className="w-full px-3 py-2 glass-card-light border border-white/10 rounded-lg text-sm text-white focus:ring-2 focus:ring-premium-blue outline-none font-arabic"
                                    >
                                      {durations.map(d => (
                                        <option key={d.value} value={d.value} className="bg-premium-navy">{d.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex gap-2 pt-2">
                                    <button
                                      onClick={() => handleSaveEdit(subscription.id)}
                                      className="flex-1 btn-premium text-white py-2 rounded-lg text-sm font-medium font-arabic"
                                    >
                                      ✅ حفظ
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="flex-1 glass-card-light text-gray-300 hover:text-white py-2 rounded-lg text-sm font-medium border border-white/10 font-arabic"
                                    >
                                      ❌ إلغاء
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          }

                          const daysRemaining = getDaysRemaining(subscription.endDate)
                          const startDate = new Date(subscription.startDate)
                          const endDate = new Date(subscription.endDate)
                          const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
                          const progressPercentage = daysRemaining > 0 ? (daysRemaining / totalDays) * 100 : 0
                          
                          const subscriptionData = `العميل: ${subscription.personName}\nالخدمة: ${subscription.subscriptionName}\nالنوع: ${subscription.category || 'غير محدد'}\nتاريخ البداية: ${formatDateArabic(subscription.startDate)}\nتاريخ الانتهاء: ${formatDateArabic(subscription.endDate)}\nالمدة المتبقية: ${daysRemaining > 0 ? `${daysRemaining} يوم` : 'منتهي'}`

                          return (
                            <div
                              key={subscription.id}
                              className="glass-card rounded-xl p-4 border border-white/10 hover:border-premium-blue/50 transition-all duration-300"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3 flex-1">
                                  <ServiceIcon serviceName={subscription.subscriptionName || subscription.category} />
                                  <div className="flex-1">
                                    <h4 className="text-white font-bold font-arabic mb-1">
                                      {subscription.personName}
                                    </h4>
                                    <p className="text-gray-300 text-sm font-arabic mb-1">{subscription.subscriptionName}</p>
                                    {subscription.category && (
                                      <span className="inline-block glass-card-light px-2 py-1 rounded text-xs font-medium text-premium-gold border border-premium-gold/30 font-arabic">
                                        {subscription.category}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  {getStatusBadge(subscription.endDate)}
                                  <CopyButton text={subscriptionData} label="نسخ" />
                                </div>
                              </div>
                              <div className="flex items-center justify-center my-3">
                                <ProgressRing 
                                  percentage={Math.max(0, Math.min(100, progressPercentage))} 
                                  daysRemaining={daysRemaining > 0 ? daysRemaining : 0}
                                  size={50}
                                  strokeWidth={5}
                                />
                              </div>
                              <div className="space-y-1 text-sm glass-card-light rounded-lg p-3 border border-white/5 mb-3">
                                <div className="flex justify-between">
                                  <span className="text-gray-400 font-arabic">تاريخ البداية:</span>
                                  <span className="text-white font-medium font-arabic">{formatDateArabic(subscription.startDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400 font-arabic">تاريخ الانتهاء:</span>
                                  <span className={`font-medium font-arabic ${
                                    daysRemaining <= 7 ? 'text-red-400' : 'text-white'
                                  }`}>
                                    {formatDateArabic(subscription.endDate)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2 border-t border-white/10">
                                <button
                                  onClick={() => handleEdit(subscription)}
                                  className="flex-1 btn-premium text-white py-2 rounded-lg text-sm font-medium font-arabic"
                                >
                                  ✏️ تعديل
                                </button>
                                <button
                                  onClick={() => handleDelete(subscription.id)}
                                  className="flex-1 glass-card-light text-red-400 hover:text-red-300 py-2 rounded-lg text-sm font-medium font-arabic border border-red-500/30"
                                >
                                  🗑️ حذف
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* All Subscriptions View */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-arabic">جميع الاشتراكات</h2>
          <Link
            to="/add"
            className="w-full sm:w-auto btn-premium text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium font-arabic flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">إضافة اشتراك جديد</span>
            <span className="sm:hidden">إضافة</span>
          </Link>
        </div>
        {filteredSubscriptions.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center border border-white/10">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-premium-blue/20 to-premium-gold/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg mb-6 font-arabic">لا توجد اشتراكات</p>
            <Link
              to="/add"
              className="inline-block btn-premium text-white px-8 py-3 rounded-xl font-medium font-arabic"
            >
              ➕ إضافة اشتراك جديد
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredSubscriptions.map((subscription) => {
              const isEditing = editingId === subscription.id

              if (isEditing) {
                return (
                  <div
                    key={subscription.id}
                    className="glass-card rounded-2xl p-6 border-2 border-premium-blue/50"
                  >
                    <h3 className="text-xl font-bold text-white mb-4 font-arabic">✏️ تعديل الاشتراك</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 font-arabic">اسم الشخص</label>
                        <input
                          type="text"
                          name="personName"
                          value={editFormData.personName}
                          onChange={handleEditChange}
                          className="w-full px-4 py-2 glass-card-light border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-premium-blue outline-none font-arabic"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 font-arabic">اسم الاشتراك</label>
                        <input
                          type="text"
                          name="subscriptionName"
                          value={editFormData.subscriptionName}
                          onChange={handleEditChange}
                          className="w-full px-4 py-2 glass-card-light border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-premium-blue outline-none font-arabic"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 font-arabic">نوع الاشتراك</label>
                        <input
                          type="text"
                          name="category"
                          value={editFormData.category}
                          onChange={handleEditChange}
                          className="w-full px-4 py-2 glass-card-light border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-premium-blue outline-none font-arabic"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 font-arabic">تاريخ البداية</label>
                        <input
                          type="date"
                          name="startDate"
                          value={editFormData.startDate}
                          onChange={handleEditChange}
                          className="w-full px-4 py-2 glass-card-light border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-premium-blue outline-none font-arabic"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 font-arabic">المدة</label>
                        <select
                          name="duration"
                          value={editFormData.duration}
                          onChange={handleEditChange}
                          className="w-full px-4 py-2 glass-card-light border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-premium-blue outline-none font-arabic"
                        >
                          {durations.map(d => (
                            <option key={d.value} value={d.value} className="bg-premium-navy">{d.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button
                          onClick={() => handleSaveEdit(subscription.id)}
                          className="flex-1 btn-premium text-white py-2.5 rounded-xl font-medium font-arabic"
                        >
                          ✅ حفظ
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 glass-card-light text-gray-300 hover:text-white py-2.5 rounded-xl font-medium border border-white/10 font-arabic"
                        >
                          ❌ إلغاء
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }

              const daysRemaining = getDaysRemaining(subscription.endDate)
              const startDate = new Date(subscription.startDate)
              const endDate = new Date(subscription.endDate)
              const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
              const progressPercentage = daysRemaining > 0 ? (daysRemaining / totalDays) * 100 : 0
              
              // بيانات للنسخ
              const subscriptionData = `العميل: ${subscription.personName}\nالخدمة: ${subscription.subscriptionName}\nالنوع: ${subscription.category || 'غير محدد'}\nتاريخ البداية: ${formatDateArabic(subscription.startDate)}\nتاريخ الانتهاء: ${formatDateArabic(subscription.endDate)}\nالمدة المتبقية: ${daysRemaining > 0 ? `${daysRemaining} يوم` : 'منتهي'}`

              return (
                <div
                  key={subscription.id}
                  className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-premium-blue/50 transition-all duration-300 hover:shadow-2xl hover:shadow-premium-blue/20 group"
                >
                  {/* Header with Icon and Status */}
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <ServiceIcon serviceName={subscription.subscriptionName || subscription.category} />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-base sm:text-lg font-arabic mb-1 group-hover:text-premium-gold transition-colors truncate">
                          {subscription.personName}
                        </h3>
                        <p className="text-gray-300 text-xs sm:text-sm font-arabic mb-2 truncate">{subscription.subscriptionName}</p>
                        {subscription.category && (
                          <span className="inline-block glass-card-light px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-xs font-medium text-premium-gold border border-premium-gold/30 font-arabic">
                            {subscription.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 sm:gap-2 flex-shrink-0">
                      {getStatusBadge(subscription.endDate)}
                      <CopyButton text={subscriptionData} label="نسخ" />
                    </div>
                  </div>

                  {/* Progress Ring */}
                  <div className="flex items-center justify-center mb-3 sm:mb-4 py-2 sm:py-4">
                    <ProgressRing 
                      percentage={Math.max(0, Math.min(100, progressPercentage))} 
                      daysRemaining={daysRemaining > 0 ? daysRemaining : 0}
                    />
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 glass-card-light rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs sm:text-sm font-arabic">تاريخ البداية:</span>
                      <span className="text-white font-medium text-xs sm:text-sm font-arabic">{formatDateArabic(subscription.startDate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs sm:text-sm font-arabic">تاريخ الانتهاء:</span>
                      <span className={`font-medium text-xs sm:text-sm font-arabic ${
                        daysRemaining <= 7 ? 'text-red-400' : 'text-white'
                      }`}>
                        {formatDateArabic(subscription.endDate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs sm:text-sm font-arabic">المدة:</span>
                      <span className="text-white font-medium text-xs sm:text-sm font-arabic">
                        {subscription.duration === 'month' && 'شهر واحد'}
                        {subscription.duration === '3months' && '3 أشهر'}
                        {subscription.duration === '6months' && '6 أشهر'}
                        {subscription.duration === 'year' && 'سنة واحدة'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 sm:pt-4 border-t border-white/10">
                    <button
                      onClick={() => handleEdit(subscription)}
                      className="flex-1 btn-premium text-white py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium font-arabic transition-all duration-300"
                    >
                      ✏️ تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(subscription.id)}
                      className="flex-1 glass-card-light text-red-400 hover:text-red-300 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium font-arabic border border-red-500/30 hover:border-red-500/50 transition-all duration-300"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
