import { db } from '../config/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore'

const COLLECTION_NAME = 'subscriptions'
const STORAGE_KEY = 'subscriptions'

// التحقق من أن Firebase مُعدّ
const isFirebaseConfigured = () => {
  try {
    // التحقق من أن db موجود وليس null
    if (!db) {
      console.warn('Firebase db is not initialized')
      return false
    }
    // التحقق من أن apiKey ليس القيمة الافتراضية
    // يمكننا التحقق من أن db هو كائن Firestore صحيح
    return true
  } catch (error) {
    console.warn('Firebase configuration check failed:', error)
    return false
  }
}

// دالة لفحص جميع المفاتيح في localStorage (للمساعدة في البحث)
export const checkAllLocalStorageKeys = () => {
  console.log('🔍 Checking all localStorage keys...')
  const allKeys = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      try {
        const value = localStorage.getItem(key)
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          allKeys.push({ key, count: parsed.length, data: parsed })
          console.log(`📦 Found array in key "${key}": ${parsed.length} items`)
        }
      } catch (e) {
        // not JSON or not array
      }
    }
  }
  return allKeys
}

// دالة لنقل البيانات من localStorage إلى Firebase (يمكن استدعاؤها من الخارج)
export const migrateLocalToFirebase = async () => {
  if (!isFirebaseConfigured()) {
    console.log('⚠️ Firebase not configured')
    return false
  }

  try {
    // أولاً، فحص جميع المفاتيح
    const allKeys = checkAllLocalStorageKeys()
    
    // جلب البيانات من localStorage - البحث في جميع المفاتيح المحتملة
    let localData = localStorage.getItem(STORAGE_KEY) || 
                    localStorage.getItem('subscriptions_backup')
    
    // إذا لم نجد، جرب البحث في جميع المفاتيح التي تحتوي على arrays
    if (!localData) {
      for (const item of allKeys) {
        if (item.count > 0) {
          // التحقق من أن البيانات تبدو كاشتراكات
          const firstItem = item.data[0]
          if (firstItem && (firstItem.personName || firstItem.subscriptionName || firstItem.endDate)) {
            localData = JSON.stringify(item.data)
            console.log(`📦 Found subscriptions data in localStorage key: ${item.key} (${item.count} items)`)
            break
          }
        }
      }
    }
    
    if (!localData) {
      console.log('📦 No subscription data found in localStorage')
      console.log('📋 Available localStorage keys:', allKeys.map(k => `${k.key} (${k.count} items)`).join(', ') || 'none')
      return false
    }

    const localSubs = JSON.parse(localData)
    if (!localSubs || !Array.isArray(localSubs) || localSubs.length === 0) {
      console.log('📦 localStorage data is empty or invalid')
      return false
    }
    
    console.log(`📦 Found ${localSubs.length} subscriptions in localStorage`)

    // جلب البيانات من Firebase
    const q = query(collection(db, COLLECTION_NAME))
    const querySnapshot = await getDocs(q)
    const firebaseSubs = []
    const firebaseDataMap = new Map()
    querySnapshot.forEach((doc) => {
      firebaseSubs.push(doc.id)
      const data = doc.data()
      // إنشاء مفتاح فريد من البيانات (بدون id)
      const key = `${data.personName}_${data.subscriptionName}_${data.startDate}_${data.endDate}`
      firebaseDataMap.set(key, true)
    })

    // إذا كانت Firebase تحتوي على بيانات أكثر أو نفس العدد، لا ننقل
    if (firebaseSubs.length >= localSubs.length) {
      console.log('📊 Firebase already has equal or more data, skipping migration')
      return false
    }

    console.log(`🔄 Migrating ${localSubs.length} subscriptions from localStorage to Firebase...`)

    // نقل البيانات إلى Firebase (تخطي المكررة بناءً على المحتوى)
    let migrated = 0
    let skipped = 0
    for (const sub of localSubs) {
      // إنشاء مفتاح فريد من البيانات
      const key = `${sub.personName}_${sub.subscriptionName}_${sub.startDate}_${sub.endDate}`
      
      // تخطي إذا كان موجوداً في Firebase (بناءً على المحتوى)
      if (firebaseDataMap.has(key)) {
        skipped++
        continue
      }

      try {
        // إزالة id القديم وإضافة جديد من Firebase
        const { id, ...subData } = sub
        await addDoc(collection(db, COLLECTION_NAME), subData)
        migrated++
        firebaseDataMap.set(key, true) // إضافة للمفتاح لتجنب التكرار
      } catch (error) {
        console.error(`❌ Error migrating subscription:`, error)
        if (error.code === 'permission-denied') {
          console.error('⚠️ Permission denied during migration! تأكد من قواعد Firestore.')
          break
        }
      }
    }

    if (migrated > 0) {
      console.log(`✅ Successfully migrated ${migrated} subscriptions to Firebase (skipped ${skipped} duplicates)`)
      return true
    } else if (skipped > 0) {
      console.log(`ℹ️ All ${skipped} subscriptions already exist in Firebase`)
      return false
    }

    return false
  } catch (error) {
    console.error('❌ Error during migration:', error)
    return false
  }
}

// دعم مزدوج: Firebase + localStorage كنسخة احتياطية
export const getSubscriptions = async () => {
  // محاولة جلب البيانات من Firebase أولاً (إذا كان مُعدّاً)
  if (isFirebaseConfigured()) {
    try {
      console.log('📥 Loading subscriptions from Firebase...')
      // محاولة جلب البيانات من Firebase
      const q = query(collection(db, COLLECTION_NAME), orderBy('endDate', 'asc'))
      const querySnapshot = await getDocs(q)
      const subscriptions = []
      const seenIds = new Set() // لمنع التكرار
      
      querySnapshot.forEach((doc) => {
        // التحقق من عدم وجود تكرار
        if (!seenIds.has(doc.id)) {
          seenIds.add(doc.id)
          subscriptions.push({ id: doc.id, ...doc.data() })
        }
      })
      
      console.log(`✅ Loaded ${subscriptions.length} subscriptions from Firebase`)
      
      // التحقق من وجود بيانات في localStorage قد تحتاج للنقل
      // تحقق من جميع المفاتيح المحتملة في localStorage
      const localData = localStorage.getItem(STORAGE_KEY) || 
                       localStorage.getItem('subscriptions_backup') ||
                       localStorage.getItem('subscription-manager-data')
      
      if (localData) {
        try {
          const localSubs = JSON.parse(localData)
          // إذا كان localStorage يحتوي على بيانات أكثر من Firebase، حاول النقل
          if (localSubs && Array.isArray(localSubs) && localSubs.length > subscriptions.length) {
            console.log(`📦 localStorage has ${localSubs.length} subscriptions, Firebase has ${subscriptions.length}, attempting migration...`)
            const migrated = await migrateLocalToFirebase()
            if (migrated) {
              // إعادة جلب البيانات بعد النقل
              const newQuerySnapshot = await getDocs(q)
              subscriptions.length = 0 // مسح القائمة
              seenIds.clear() // مسح Set أيضاً
              newQuerySnapshot.forEach((doc) => {
                // التحقق من عدم وجود تكرار
                if (!seenIds.has(doc.id)) {
                  seenIds.add(doc.id)
                  subscriptions.push({ id: doc.id, ...doc.data() })
                }
              })
              console.log(`✅ Loaded ${subscriptions.length} subscriptions after migration`)
            }
          } else if (localSubs && Array.isArray(localSubs) && localSubs.length > 0 && subscriptions.length === 0) {
            // إذا كان Firebase فارغ تماماً و localStorage يحتوي على بيانات، انقلها
            console.log(`📦 Firebase is empty but localStorage has ${localSubs.length} subscriptions, attempting migration...`)
            const migrated = await migrateLocalToFirebase()
            if (migrated) {
              // إعادة جلب البيانات بعد النقل
              const newQuerySnapshot = await getDocs(q)
              subscriptions.length = 0 // مسح القائمة
              seenIds.clear() // مسح Set أيضاً
              newQuerySnapshot.forEach((doc) => {
                // التحقق من عدم وجود تكرار
                if (!seenIds.has(doc.id)) {
                  seenIds.add(doc.id)
                  subscriptions.push({ id: doc.id, ...doc.data() })
                }
              })
              console.log(`✅ Loaded ${subscriptions.length} subscriptions after migration`)
            }
          }
        } catch (e) {
          console.warn('Error parsing localStorage data:', e)
        }
      }
      
      // حفظ نسخة محلية كنسخة احتياطية
      if (subscriptions.length > 0) {
        localStorage.setItem('subscriptions_backup', JSON.stringify(subscriptions))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions))
      }
      
      return subscriptions
    } catch (error) {
      console.error('❌ Error loading from Firebase:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message
      })
      
      if (error.code === 'permission-denied') {
        console.error('⚠️ Permission denied! تأكد من أن قواعد Firestore تسمح بالقراءة.')
      }
      
      // في حالة الخطأ، استخدم localStorage
      console.log('📦 Falling back to localStorage...')
    }
  } else {
    console.log('⚠️ Firebase not configured, using localStorage only')
  }
  
  // Fallback إلى localStorage
  try {
    const data = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('subscriptions_backup')
    const subscriptions = data ? JSON.parse(data) : []
    console.log(`📦 Loaded ${subscriptions.length} subscriptions from localStorage`)
    return subscriptions
  } catch (error) {
    console.error('Error loading subscriptions from localStorage:', error)
    return []
  }
}

// دالة للاستماع للتحديثات الفورية من Firebase
export const subscribeToSubscriptions = (callback) => {
  // إذا لم يكن Firebase مُعدّاً، استخدم localStorage فقط
  if (!isFirebaseConfigured()) {
    console.log('⚠️ Firebase not configured, using localStorage polling')
    const data = localStorage.getItem(STORAGE_KEY)
    callback(data ? JSON.parse(data) : [])
    
    // محاولة تحديث كل ثانية من localStorage
    const interval = setInterval(() => {
      const localData = localStorage.getItem(STORAGE_KEY)
      callback(localData ? JSON.parse(localData) : [])
    }, 1000)
    
    return () => clearInterval(interval)
  }

  try {
    console.log('👂 Setting up Firebase real-time listener...')
    const q = query(collection(db, COLLECTION_NAME), orderBy('endDate', 'asc'))
    return onSnapshot(q, (querySnapshot) => {
      const subscriptions = []
      const seenIds = new Set() // لمنع التكرار
      
      querySnapshot.forEach((doc) => {
        // التحقق من عدم وجود تكرار
        if (!seenIds.has(doc.id)) {
          seenIds.add(doc.id)
          subscriptions.push({ id: doc.id, ...doc.data() })
        }
      })
      
      console.log(`🔄 Real-time update: ${subscriptions.length} subscriptions`)
      // حفظ نسخة محلية (استبدال كامل لمنع التكرار)
      localStorage.setItem('subscriptions_backup', JSON.stringify(subscriptions))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions))
      callback(subscriptions)
    }, (error) => {
      console.error('❌ Error in subscription listener:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message
      })
      
      if (error.code === 'permission-denied') {
        console.error('⚠️ Permission denied! تأكد من أن قواعد Firestore تسمح بالقراءة.')
      }
      
      // Fallback إلى localStorage
      const data = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('subscriptions_backup')
      callback(data ? JSON.parse(data) : [])
    })
  } catch (error) {
    console.error('❌ Error setting up subscription listener:', error)
    const data = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('subscriptions_backup')
    callback(data ? JSON.parse(data) : [])
    return () => {} // return empty unsubscribe function
  }
}

export const saveSubscriptions = (subscriptions) => {
  try {
    // حفظ محلي كنسخة احتياطية
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions))
  } catch (error) {
    console.error('Error saving subscriptions:', error)
  }
}

export const addSubscription = async (subscription) => {
  console.log('🔄 Adding subscription...', subscription)
  
  const newSubscription = {
    ...subscription,
    createdAt: new Date().toISOString()
  }

  // محاولة إضافة إلى Firebase أولاً (إذا كان مُعدّاً)
  if (isFirebaseConfigured()) {
    try {
      // التحقق من عدم وجود اشتراك مكرر بناءً على المحتوى
      const existingSubs = await getSubscriptions()
      const subscriptionKey = `${newSubscription.personName}_${newSubscription.subscriptionName}_${newSubscription.startDate}_${newSubscription.endDate}`
      
      const isDuplicate = existingSubs.some(sub => {
        const subKey = `${sub.personName}_${sub.subscriptionName}_${sub.startDate}_${sub.endDate}`
        return subKey === subscriptionKey
      })
      
      if (isDuplicate) {
        console.warn('⚠️ Duplicate subscription detected, skipping add')
        throw new Error('DUPLICATE_SUBSCRIPTION')
      }
      
      console.log('📤 Attempting to add to Firebase...')
      console.log('📤 Data:', newSubscription)
      console.log('📤 Collection:', COLLECTION_NAME)
      
      // إضافة إلى Firebase
      const docRef = await addDoc(collection(db, COLLECTION_NAME), newSubscription)
      console.log('✅ Successfully added to Firebase with ID:', docRef.id)
      
      // لا نحتاج لإضافة localStorage يدوياً هنا لأن Firebase listener سيقوم بذلك تلقائياً
      // هذا يمنع التكرار عند فتح الموقع مرتين
      
      return { id: docRef.id, ...newSubscription }
    } catch (error) {
      // إذا كان الخطأ متعلقاً بالتكرار، أبلغ المستخدم ولا تحاول Fallback
      if (error.message === 'DUPLICATE_SUBSCRIPTION') {
        console.warn('⚠️ هذا الاشتراك موجود بالفعل')
        alert('⚠️ هذا الاشتراك موجود بالفعل!\n\nالاسم: ' + newSubscription.personName + '\nالخدمة: ' + newSubscription.subscriptionName)
        throw error // أعد رمي الخطأ لمنع المتابعة
      }
      
      console.error('❌ Error adding subscription to Firebase:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        name: error.name
      })
      
      // إذا كان الخطأ متعلقاً بالقواعد (permission denied)، أخبر المستخدم
      if (error.code === 'permission-denied') {
        console.error('⚠️ Permission denied! تأكد من أن قواعد Firestore تسمح بالكتابة.')
        alert('⚠️ خطأ في الصلاحيات! تأكد من إعداد قواعد Firestore بشكل صحيح.\n\nافتح Firebase Console > Firestore Database > Rules')
      }
      
      // Fallback إلى localStorage
      console.log('📦 Falling back to localStorage...')
    }
  } else {
    console.log('⚠️ Firebase not configured, using localStorage only')
  }
  
  // Fallback إلى localStorage
  try {
    const subscriptions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    
    // التحقق من التكرار في localStorage أيضاً
    const subscriptionKey = `${newSubscription.personName}_${newSubscription.subscriptionName}_${newSubscription.startDate}_${newSubscription.endDate}`
    const isDuplicate = subscriptions.some(sub => {
      const subKey = `${sub.personName}_${sub.subscriptionName}_${sub.startDate}_${sub.endDate}`
      return subKey === subscriptionKey
    })
    
    if (isDuplicate) {
      console.warn('⚠️ Duplicate subscription detected in localStorage, skipping add')
      alert('⚠️ هذا الاشتراك موجود بالفعل!\n\nالاسم: ' + newSubscription.personName + '\nالخدمة: ' + newSubscription.subscriptionName)
      throw new Error('DUPLICATE_SUBSCRIPTION')
    }
    
    const newSub = {
      id: Date.now().toString(),
      ...newSubscription
    }
    subscriptions.push(newSub)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions))
    console.log('✅ Added to localStorage')
    return newSub
  } catch (localError) {
    // إذا كان الخطأ متعلقاً بالتكرار، أعد رميه
    if (localError.message === 'DUPLICATE_SUBSCRIPTION') {
      throw localError
    }
    console.error('❌ Error adding to localStorage:', localError)
    throw localError
  }
}

export const deleteSubscription = async (id) => {
  // إذا لم يكن Firebase مُعدّاً، استخدم localStorage فقط
  if (!isFirebaseConfigured()) {
    try {
      const subscriptions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      const filtered = subscriptions.filter(sub => sub.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error('Error deleting subscription from localStorage:', error)
    }
    return
  }

  try {
    // حذف من Firebase
    await deleteDoc(doc(db, COLLECTION_NAME, id))
    
    // لا نحتاج لحذف من localStorage يدوياً لأن Firebase listener سيقوم بذلك تلقائياً
    // هذا يمنع أي مشاكل محتملة مع التكرار
  } catch (error) {
    console.error('Error deleting subscription from Firebase:', error)
    // Fallback إلى localStorage فقط في حالة الخطأ
    const subscriptions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const filtered = subscriptions.filter(sub => sub.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  }
}

export const updateSubscription = async (id, updates) => {
  // إذا لم يكن Firebase مُعدّاً، استخدم localStorage فقط
  if (!isFirebaseConfigured()) {
    try {
      const subscriptions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      const index = subscriptions.findIndex(sub => sub.id === id)
      if (index !== -1) {
        subscriptions[index] = { ...subscriptions[index], ...updates }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions))
        return subscriptions[index]
      }
      return null
    } catch (error) {
      console.error('Error updating subscription in localStorage:', error)
      return null
    }
  }

  try {
    // تحديث في Firebase
    const subRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(subRef, updates)
    
    // لا نحتاج لتحديث localStorage يدوياً لأن Firebase listener سيقوم بذلك تلقائياً
    // هذا يمنع أي مشاكل محتملة مع التكرار
    
    // إرجاع البيانات المحدثة (سيتم تحديثها من listener)
    const subscriptions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const index = subscriptions.findIndex(sub => sub.id === id)
    if (index !== -1) {
      return { ...subscriptions[index], ...updates }
    }
    return null
  } catch (error) {
    console.error('Error updating subscription in Firebase:', error)
    // Fallback إلى localStorage فقط في حالة الخطأ
    const subscriptions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const index = subscriptions.findIndex(sub => sub.id === id)
    if (index !== -1) {
      subscriptions[index] = { ...subscriptions[index], ...updates }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions))
      return subscriptions[index]
    }
    return null
  }
}
