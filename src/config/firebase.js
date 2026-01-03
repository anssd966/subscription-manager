import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// ⚠️ استبدل هذه القيم بقيم مشروعك من Firebase Console
// اذهب إلى: https://console.firebase.google.com
// 1. أنشئ مشروع جديد
// 2. فعّل Firestore Database
// 3. اضغط على ⚙️ Settings > Project settings
// 4. في قسم "Your apps" اضغط على أيقونة الويب </>
// 5. انسخ القيم وضعها هنا

const firebaseConfig = {
  apiKey: "AIzaSyBGyYgnXuGtBj4fMru3pJ-k2sbdYoKa3B8",
  authDomain: "subscription-manager-f6570.firebaseapp.com",
  projectId: "subscription-manager-f6570",
  storageBucket: "subscription-manager-f6570.firebasestorage.app",
  messagingSenderId: "855302682540",
  appId: "1:855302682540:web:fd3f7c495678a8e61b6c09",
  measurementId: "G-80MQTKNN8E"
}

// التحقق من أن القيم ليست القيم الافتراضية
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY"

if (!isConfigured) {
  console.warn('⚠️ Firebase غير مُعدّ بعد! يرجى إضافة بيانات الإعداد من Firebase Console')
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

