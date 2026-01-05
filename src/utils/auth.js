import { db } from '../config/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const PIN_KEY = 'app_pin'
const DEFAULT_PIN = '1234'

// التحقق من أن Firebase مُعدّ
const isFirebaseConfigured = () => {
  try {
    return db && db._delegate
  } catch (error) {
    return false
  }
}

// الحصول على PIN من Firebase أو localStorage
export const getPin = async () => {
  // محاولة جلب من Firebase أولاً (إذا كان مُعدّاً)
  if (isFirebaseConfigured()) {
    try {
      const pinDoc = await getDoc(doc(db, 'settings', PIN_KEY))
      if (pinDoc.exists()) {
        const pin = pinDoc.data().pin
        // حفظ نسخة في localStorage كنسخة احتياطية
        if (pin) {
          localStorage.setItem('app_pin', pin)
        }
        return pin
      }
    } catch (error) {
      console.error('Error getting PIN from Firebase:', error)
      // في حالة الخطأ، استخدم localStorage
    }
  }
  
  // Fallback إلى localStorage
  const localPin = localStorage.getItem('app_pin')
  if (localPin) {
    return localPin
  }
  
  // إذا لم يوجد أي PIN، استخدم الافتراضي
  return DEFAULT_PIN
}

// حفظ PIN في Firebase و localStorage
export const savePin = async (pinValue) => {
  if (!pinValue || pinValue.length < 4) {
    throw new Error('الرمز يجب أن يكون 4 أرقام على الأقل')
  }

  // حفظ في localStorage أولاً (لضمان العمل حتى لو فشل Firebase)
  localStorage.setItem('app_pin', pinValue)

  // محاولة حفظ في Firebase (إذا كان مُعدّاً)
  if (isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, 'settings', PIN_KEY), { pin: pinValue })
      console.log('✅ PIN saved to Firebase')
    } catch (error) {
      console.error('Error saving PIN to Firebase:', error)
      // لا نرمي خطأ، لأننا حفظنا في localStorage
      console.log('⚠️ PIN saved to localStorage only (Firebase failed)')
    }
  } else {
    console.log('⚠️ Firebase not configured, PIN saved to localStorage only')
  }
  
  return true
}

// التحقق من PIN
export const verifyPin = async (pin) => {
  try {
    const storedPin = await getPin()
    const isValid = pin === storedPin
    
    if (isValid) {
      console.log('✅ PIN verified successfully')
    } else {
      console.log('❌ PIN verification failed')
    }
    
    return isValid
  } catch (error) {
    console.error('Error verifying PIN:', error)
    // في حالة الخطأ، نتحقق من localStorage مباشرة
    const localPin = localStorage.getItem('app_pin') || DEFAULT_PIN
    return pin === localPin
  }
}

// التحقق من وجود PIN
export const pinExists = async () => {
  // التحقق من localStorage أولاً (أسرع)
  const localPin = localStorage.getItem('app_pin')
  if (localPin) {
    return true
  }
  
  // محاولة التحقق من Firebase (إذا كان مُعدّاً)
  if (isFirebaseConfigured()) {
    try {
      const pinDoc = await getDoc(doc(db, 'settings', PIN_KEY))
      if (pinDoc.exists()) {
        return true
      }
    } catch (error) {
      console.error('Error checking PIN in Firebase:', error)
    }
  }
  
  // إذا لم يوجد في أي مكان، لا يوجد PIN
  return false
}

