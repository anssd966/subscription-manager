import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import AddSubscription from './components/AddSubscription'
import Renewals from './components/Renewals'
import { getSubscriptions } from './utils/storage'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddSubscription />} />
          <Route path="/renewals" element={<Renewals />} />
        </Routes>
      </div>
    </Router>
  )
}

function Navbar() {
  const location = useLocation()
  const [subscriptions, setSubscriptions] = useState([])

  useEffect(() => {
    const loadSubscriptions = async () => {
      const subs = await getSubscriptions()
      setSubscriptions(subs)
    }
    loadSubscriptions()
    const interval = setInterval(loadSubscriptions, 1000)
    return () => clearInterval(interval)
  }, [])

  const activeCount = subscriptions.filter(sub => {
    const endDate = new Date(sub.endDate)
    return endDate > new Date()
  }).length

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-reverse space-x-8">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              الرئيسية
            </Link>
            <Link
              to="/add"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/add') 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              إضافة اشتراك
            </Link>
            <Link
              to="/renewals"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/renewals') 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              الاشتراكات القادمة للتجديد
            </Link>
          </div>
          <div className="flex items-center space-x-reverse space-x-4">
            <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg font-semibold">
              الاشتراكات النشطة: {activeCount}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default App

