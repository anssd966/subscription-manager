import { useState, useEffect } from 'react'
import { getPin, savePin, pinExists, verifyPin } from '../utils/auth'

const DEFAULT_PIN = '1234' // PIN الافتراضي - يمكن تغييره لاحقاً

function Login({ onLogin }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')


  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!pin.trim()) {
      setError('يرجى إدخال الرمز')
      return
    }

    try {
      const isValid = await verifyPin(pin)
      
      if (isValid) {
        // حفظ حالة تسجيل الدخول في sessionStorage و localStorage
        sessionStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('isAuthenticated', 'true')
        onLogin()
      } else {
        setError('الرمز غير صحيح. الرمز الافتراضي: 1234')
        setPin('')
      }
    } catch (error) {
      console.error('Login error:', error)
      // في حالة الخطأ، نتحقق من localStorage مباشرة
      const localPin = localStorage.getItem('app_pin') || '1234'
      if (pin === localPin) {
        sessionStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('isAuthenticated', 'true')
        onLogin()
      } else {
        setError('الرمز غير صحيح. الرمز الافتراضي: 1234')
        setPin('')
      }
    }
  }

  const handleSetup = async (e) => {
    e.preventDefault()
    setError('')

    if (!newPin.trim() || newPin.length < 4) {
      setError('الرمز يجب أن يكون 4 أرقام على الأقل')
      return
    }

    if (newPin !== confirmPin) {
      setError('الرمز وتأكيد الرمز غير متطابقين')
      return
    }

    try {
      await savePin(newPin)
      // حفظ حالة تسجيل الدخول في sessionStorage و localStorage
      sessionStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('isAuthenticated', 'true')
      alert('✅ تم إعداد الرمز بنجاح!')
      onLogin()
    } catch (error) {
      console.error('Setup error:', error)
      setError('حدث خطأ أثناء حفظ الرمز')
    }
  }

  // التحقق من وجود PIN عند تحميل الصفحة
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const exists = await pinExists()
        if (!exists) {
          setIsSettingUp(true)
        }
      } catch (error) {
        console.error('Error checking PIN setup:', error)
        // في حالة الخطأ، نتحقق من localStorage
        const localPin = localStorage.getItem('app_pin')
        if (!localPin) {
          setIsSettingUp(true)
        }
      }
    }
    checkSetup()
  }, [])

  if (isSettingUp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إعداد الرمز</h1>
            <p className="text-gray-600">قم بإعداد رمز للوصول إلى بياناتك</p>
          </div>

          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label htmlFor="newPin" className="block text-sm font-medium text-gray-700 mb-2">
                الرمز الجديد (4 أرقام على الأقل)
              </label>
              <input
                type="password"
                id="newPin"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-center text-2xl tracking-widest"
                placeholder="أدخل الرمز"
                maxLength={10}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700 mb-2">
                تأكيد الرمز
              </label>
              <input
                type="password"
                id="confirmPin"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-center text-2xl tracking-widest"
                placeholder="أعد إدخال الرمز"
                maxLength={10}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              حفظ الرمز
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            ⚠️ احفظ هذا الرمز في مكان آمن. لن تتمكن من الوصول للبيانات بدونه.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">تسجيل الدخول</h1>
          <p className="text-gray-600">أدخل الرمز للوصول إلى بياناتك</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
              الرمز
            </label>
            <input
              type="password"
              id="pin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-center text-2xl tracking-widest"
              placeholder="أدخل الرمز"
              maxLength={10}
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            دخول
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          💡 الرمز الافتراضي: <code className="bg-gray-100 px-2 py-1 rounded">1234</code>
          <br />
          (يمكنك تغييره بعد تسجيل الدخول)
        </p>
      </div>
    </div>
  )
}

export default Login

