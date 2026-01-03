import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addSubscription } from '../utils/storage'
import { calculateEndDate } from '../utils/dateUtils'

function AddSubscription() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    personName: '',
    subscriptionName: '',
    category: '',
    startDate: new Date().toISOString().split('T')[0],
    duration: 'month'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.personName.trim() || !formData.subscriptionName.trim() || !formData.category.trim()) {
      alert('يرجى ملء جميع الحقول')
      return
    }

    const endDate = calculateEndDate(formData.startDate, formData.duration)
    
    await addSubscription({
      ...formData,
      endDate
    })

    alert('تم إضافة الاشتراك بنجاح!')
    navigate('/')
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">إضافة اشتراك جديد</h1>
        <p className="text-gray-600">أضف معلومات الاشتراك الجديد</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="personName" className="block text-sm font-medium text-gray-700 mb-2">
              اسم الشخص
            </label>
            <input
              type="text"
              id="personName"
              name="personName"
              value={formData.personName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="أدخل اسم الشخص"
            />
          </div>

          <div>
            <label htmlFor="subscriptionName" className="block text-sm font-medium text-gray-700 mb-2">
              اسم الاشتراك
            </label>
            <input
              type="text"
              id="subscriptionName"
              name="subscriptionName"
              value={formData.subscriptionName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="أدخل اسم الاشتراك"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              نوع الاشتراك (التصنيف)
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="مثال: ChatGPT, Canva, Netflix..."
            />
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              تاريخ البداية
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              مدة الاشتراك
            </label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="month">شهر واحد</option>
              <option value="3months">3 أشهر</option>
              <option value="6months">6 أشهر</option>
              <option value="year">سنة واحدة</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              إضافة الاشتراك
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddSubscription
