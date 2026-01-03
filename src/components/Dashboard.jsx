import { useState, useEffect } from 'react'
import { getSubscriptions, deleteSubscription, updateSubscription, subscribeToSubscriptions, migrateLocalToFirebase } from '../utils/storage'
import { getDaysRemaining, formatDateArabic, isExpired, isExpiringSoon, calculateEndDate } from '../utils/dateUtils'
import { Link } from 'react-router-dom'

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

  const handleRestoreFromLocal = async () => {
    if (window.confirm('هل تريد استعادة الاشتراكات القديمة من المتصفح؟\n\nسيتم نقل جميع الاشتراكات المحفوظة محلياً إلى Firebase.\n\nافتح Console (F12) لرؤية التفاصيل.')) {
      try {
        // فحص جميع المفاتيح أولاً
        const { checkAllLocalStorageKeys } = await import('../utils/storage')
        checkAllLocalStorageKeys()
        
        const { migrateLocalToFirebase } = await import('../utils/storage')
        const result = await migrateLocalToFirebase()
        if (result) {
          alert('✅ تم استعادة الاشتراكات بنجاح!\n\nأعد تحميل الصفحة لرؤية جميع الاشتراكات.')
          await loadSubscriptions()
          // إعادة تحميل الصفحة بعد ثانيتين
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        } else {
          const message = 'ℹ️ لا توجد اشتراكات قديمة للاستعادة، أو تم نقلها مسبقاً.\n\n' +
                         'افتح Console (F12) لرؤية جميع المفاتيح في localStorage.\n\n' +
                         'إذا كانت لديك نسخة احتياطية (JSON)، استخدم زر "استيراد من ملف" أدناه.'
          alert(message)
        }
      } catch (error) {
        console.error('Error restoring:', error)
        alert('❌ حدث خطأ أثناء الاستعادة.\n\nافتح Console (F12) لرؤية التفاصيل.')
      }
    }
  }

  const handleImportFromFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)
        
        if (!Array.isArray(data)) {
          alert('❌ الملف غير صحيح. يجب أن يحتوي على مصفوفة من الاشتراكات.')
          return
        }

        if (data.length === 0) {
          alert('ℹ️ الملف فارغ.')
          return
        }

        if (window.confirm(`هل تريد استيراد ${data.length} اشتراك من الملف؟`)) {
          const { addSubscription } = await import('../utils/storage')
          let imported = 0
          let errors = 0

          for (const sub of data) {
            try {
              // تخطي id القديم
              const { id, ...subData } = sub
              await addSubscription(subData)
              imported++
            } catch (error) {
              console.error('Error importing subscription:', error)
              errors++
            }
          }

          alert(`✅ تم استيراد ${imported} اشتراك بنجاح${errors > 0 ? `\n❌ ${errors} أخطاء` : ''}`)
          await loadSubscriptions()
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }
      } catch (error) {
        console.error('Error reading file:', error)
        alert('❌ حدث خطأ أثناء قراءة الملف. تأكد من أن الملف بصيغة JSON صحيحة.')
      }
    }
    input.click()
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
      return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">منتهي</span>
    } else if (expiring) {
      return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">قريباً</span>
    } else {
      return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">نشط</span>
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">لوحة التحكم</h1>
            <p className="text-gray-600">إدارة جميع الاشتراكات الخاصة بك</p>
            <p className="text-sm text-gray-500 mt-1">
              💾 البيانات تُحفظ تلقائياً في Firebase - لن تفقدها مرة أخرى
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRestoreFromLocal}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              title="استعادة الاشتراكات القديمة من المتصفح"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              استعادة من المتصفح
            </button>
            <button
              onClick={handleImportFromFile}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              title="استيراد الاشتراكات من ملف JSON"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              استيراد من ملف
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          الكل
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          النشطة
        </button>
        <button
          onClick={() => setFilter('expiring')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            filter === 'expiring' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          قريبة من الانتهاء
        </button>
        <button
          onClick={() => setFilter('expired')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            filter === 'expired' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          المنتهية
        </button>
      </div>

      {/* Search and Category Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              البحث (الاسم أو نوع الاشتراك)
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="ابحث بالاسم أو نوع الاشتراك..."
            />
          </div>
          <div>
            <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 mb-2">
              تصفية حسب نوع الاشتراك
            </label>
            <select
              id="categoryFilter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="all">جميع الأنواع</option>
              {getAllCategories().map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Subscriptions by Duration */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">الاشتراكات حسب المدة</h2>
        <div className="space-y-4">
          {durations.map(d => {
            const durationSubs = getSubscriptionsByDuration(d.value)
            const filteredSubs = filterSubscriptions(durationSubs)
            const isExpanded = expandedCategory === d.value

            return (
              <div key={d.value} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : d.value)}
                  className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-gray-900">{d.label}</h3>
                    <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                      {filteredSubs.length} اشتراك
                    </span>
                  </div>
                  <svg
                    className={`w-6 h-6 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-6 py-4 border-t">
                    {filteredSubs.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">لا توجد اشتراكات في هذه الفئة</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSubs.map((subscription) => {
                          const daysRemaining = getDaysRemaining(subscription.endDate)
                          const isEditing = editingId === subscription.id

                          if (isEditing) {
                            return (
                              <div
                                key={subscription.id}
                                className="bg-indigo-50 rounded-lg p-4 border-2 border-indigo-200"
                              >
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">اسم الشخص</label>
                                    <input
                                      type="text"
                                      name="personName"
                                      value={editFormData.personName}
                                      onChange={handleEditChange}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">اسم الاشتراك</label>
                                    <input
                                      type="text"
                                      name="subscriptionName"
                                      value={editFormData.subscriptionName}
                                      onChange={handleEditChange}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">نوع الاشتراك</label>
                                    <input
                                      type="text"
                                      name="category"
                                      value={editFormData.category}
                                      onChange={handleEditChange}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">تاريخ البداية</label>
                                    <input
                                      type="date"
                                      name="startDate"
                                      value={editFormData.startDate}
                                      onChange={handleEditChange}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">المدة</label>
                                    <select
                                      name="duration"
                                      value={editFormData.duration}
                                      onChange={handleEditChange}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    >
                                      {durations.map(d => (
                                        <option key={d.value} value={d.value}>{d.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex gap-2 pt-2">
                                    <button
                                      onClick={() => handleSaveEdit(subscription.id)}
                                      className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                                    >
                                      حفظ
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-300"
                                    >
                                      إلغاء
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          }

                          return (
                            <div
                              key={subscription.id}
                              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h4 className="text-lg font-bold text-gray-900 mb-1">
                                    {subscription.personName}
                                  </h4>
                                  <p className="text-gray-600 text-sm mb-1">{subscription.subscriptionName}</p>
                                  {subscription.category && (
                                    <span className="inline-block bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium">
                                      {subscription.category}
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEdit(subscription)}
                                    className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                    title="تعديل"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(subscription.id)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                    title="حذف"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">تاريخ البداية:</span>
                                  <span className="font-medium">{formatDateArabic(subscription.startDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">تاريخ الانتهاء:</span>
                                  <span className="font-medium">{formatDateArabic(subscription.endDate)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t">
                                  <span className="text-gray-600 font-semibold">المتبقي:</span>
                                  <span className={`font-bold ${
                                    daysRemaining < 0 ? 'text-red-600' :
                                    daysRemaining <= 7 ? 'text-yellow-600' :
                                    'text-green-600'
                                  }`}>
                                    {daysRemaining < 0 
                                      ? `منتهي منذ ${Math.abs(daysRemaining)} يوم`
                                      : daysRemaining === 0
                                      ? 'ينتهي اليوم!'
                                      : `متبقي ${daysRemaining} يوم`
                                    }
                                  </span>
                                </div>
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">جميع الاشتراكات</h2>
        {filteredSubscriptions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">لا توجد اشتراكات</p>
            <Link
              to="/add"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              إضافة اشتراك جديد
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubscriptions.map((subscription) => {
              const isEditing = editingId === subscription.id

              if (isEditing) {
                return (
                  <div
                    key={subscription.id}
                    className="bg-indigo-50 rounded-xl shadow-lg p-6 border-2 border-indigo-200"
                  >
                    <h3 className="text-lg font-bold text-gray-900 mb-4">تعديل الاشتراك</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">اسم الشخص</label>
                        <input
                          type="text"
                          name="personName"
                          value={editFormData.personName}
                          onChange={handleEditChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">اسم الاشتراك</label>
                        <input
                          type="text"
                          name="subscriptionName"
                          value={editFormData.subscriptionName}
                          onChange={handleEditChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">نوع الاشتراك</label>
                        <input
                          type="text"
                          name="category"
                          value={editFormData.category}
                          onChange={handleEditChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ البداية</label>
                        <input
                          type="date"
                          name="startDate"
                          value={editFormData.startDate}
                          onChange={handleEditChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">المدة</label>
                        <select
                          name="duration"
                          value={editFormData.duration}
                          onChange={handleEditChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                          {durations.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button
                          onClick={() => handleSaveEdit(subscription.id)}
                          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700"
                        >
                          حفظ
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={subscription.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {subscription.personName}
                      </h3>
                      <p className="text-gray-600 text-sm">{subscription.subscriptionName}</p>
                      {subscription.category && (
                        <span className="inline-block bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium mt-1">
                          {subscription.category}
                        </span>
                      )}
                    </div>
                    {getStatusBadge(subscription.endDate)}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">تاريخ البداية:</span>
                      <span className="font-medium">{formatDateArabic(subscription.startDate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">تاريخ الانتهاء:</span>
                      <span className="font-medium">{formatDateArabic(subscription.endDate)}</span>
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
                      {getDaysRemainingBadge(subscription.endDate)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(subscription)}
                      className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(subscription.id)}
                      className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors"
                    >
                      حذف
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
