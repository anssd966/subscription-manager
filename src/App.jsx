import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import AddSubscription from './components/AddSubscription'
import Renewals from './components/Renewals'
import NotificationBell from './components/NotificationBell'
import { getSubscriptions } from './utils/storage'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-premium-navy via-premium-dark to-premium-navy">
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

  const expiringSoon = subscriptions.filter(sub => {
    const endDate = new Date(sub.endDate)
    const daysRemaining = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))
    return daysRemaining > 0 && daysRemaining <= 7
  }).length

  return (
    <nav className="glass-card sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-reverse space-x-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-premium-blue to-premium-gold flex items-center justify-center glow-blue">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg font-arabic">Premium Store</h1>
                <p className="text-gray-400 text-xs">إدارة الاشتراكات الرقمية</p>
              </div>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <Link
              to="/"
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-300 font-arabic ${
                isActive('/') 
                  ? 'btn-premium text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              الرئيسية
            </Link>
            <Link
              to="/add"
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-300 font-arabic ${
                isActive('/add') 
                  ? 'btn-premium text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              إضافة اشتراك
            </Link>
            <Link
              to="/renewals"
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-300 font-arabic ${
                isActive('/renewals') 
                  ? 'btn-premium text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              التجديدات القادمة
            </Link>
          </div>
          <div className="flex items-center space-x-reverse space-x-4">
            <NotificationBell />
            <div className="glass-card-light px-5 py-2.5 rounded-lg border border-premium-blue/30">
              <div className="text-premium-gold text-xs font-arabic mb-1">الاشتراكات النشطة</div>
              <div className="text-white font-bold text-xl font-arabic">{activeCount}</div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default App

