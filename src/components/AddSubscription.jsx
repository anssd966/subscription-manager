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
        <h1 className="text-4xl font-bold text-white font-arabic mb-2">➕ إضافة اشتراك جديد</h1>
        <p className="text-gray-400 font-arabic">أضف معلومات الاشتراك الجديد</p>
      </div>

      <div className="glass-card rounded-2xl p-8 border border-white/10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="personName" className="block text-sm font-medium text-gray-300 mb-2 font-arabic">
              اسم الشخص
            </label>
            <input
              type="text"
              id="personName"
              name="personName"
              value={formData.personName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 glass-card-light border border-white/10 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-premium-blue focus:border-premium-blue outline-none font-arabic"
              placeholder="أدخل اسم الشخص"
            />
          </div>

          <div>
            <label htmlFor="subscriptionName" className="block text-sm font-medium text-gray-300 mb-2 font-arabic">
              اسم الاشتراك
            </label>
            <input
              type="text"
              id="subscriptionName"
              name="subscriptionName"
              value={formData.subscriptionName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 glass-card-light border border-white/10 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-premium-blue focus:border-premium-blue outline-none font-arabic"
              placeholder="أدخل اسم الاشتراك"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2 font-arabic">
              نوع الاشتراك (التصنيف)
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 glass-card-light border border-white/10 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-premium-blue focus:border-premium-blue outline-none font-arabic"
              placeholder="مثال: ChatGPT, Canva, Netflix..."
            />
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2 font-arabic">
              تاريخ البداية
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 glass-card-light border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-premium-blue focus:border-premium-blue outline-none font-arabic"
            />
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-2 font-arabic">
              مدة الاشتراك
            </label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 glass-card-light border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-premium-blue focus:border-premium-blue outline-none font-arabic"
            >
              <option value="month" className="bg-premium-navy">شهر واحد</option>
              <option value="3months" className="bg-premium-navy">3 أشهر</option>
              <option value="6months" className="bg-premium-navy">6 أشهر</option>
              <option value="year" className="bg-premium-navy">سنة واحدة</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 btn-premium text-white py-3 rounded-xl font-medium font-arabic"
            >
              ✅ إضافة الاشتراك
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 glass-card-light text-gray-300 hover:text-white py-3 rounded-xl font-medium border border-white/10 font-arabic"
            >
              ❌ إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddSubscription
