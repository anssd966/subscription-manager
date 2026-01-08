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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const loadSubscriptions = async () => {
      const subs = await getSubscriptions()
      setSubscriptions(subs)
    }
    loadSubscriptions()
    // من خلال انس 
    //const interval = setInterval(loadSubscriptions, 1000)
    //return () => clearInterval(interval)
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-premium-blue to-premium-gold flex items-center justify-center glow-blue">
              <span className="text-white font-bold text-lg sm:text-xl">P</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-white font-bold text-base sm:text-lg font-arabic">Premium Store</h1>
              <p className="text-gray-400 text-xs">إدارة الاشتراكات الرقمية</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-reverse space-x-4 lg:space-x-6">
            <div className="h-8 w-px bg-white/20"></div>
            <Link
              to="/"
              className={`px-3 lg:px-5 py-2 rounded-lg text-sm lg:text-base font-medium transition-all duration-300 font-arabic ${
                isActive('/') 
                  ? 'btn-premium text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              الرئيسية
            </Link>
            <Link
              to="/add"
              className={`px-3 lg:px-5 py-2 rounded-lg text-sm lg:text-base font-medium transition-all duration-300 font-arabic ${
                isActive('/add') 
                  ? 'btn-premium text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              إضافة اشتراك
            </Link>
            <Link
              to="/renewals"
              className={`px-3 lg:px-5 py-2 rounded-lg text-sm lg:text-base font-medium transition-all duration-300 font-arabic ${
                isActive('/renewals') 
                  ? 'btn-premium text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              التجديدات القادمة
            </Link>
          </div>

          {/* Right Side - Stats and Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center space-x-reverse space-x-2 lg:space-x-4">
              <NotificationBell />
              <div className="glass-card-light px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2.5 rounded-lg border border-premium-blue/30">
                <div className="text-premium-gold text-xs font-arabic mb-0.5 sm:mb-1">الاشتراكات النشطة</div>
                <div className="text-white font-bold text-lg sm:text-xl font-arabic">{activeCount}</div>
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden glass-card-light p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4">
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 font-arabic ${
                  isActive('/') 
                    ? 'btn-premium text-white' 
                    : 'glass-card-light text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                الرئيسية
              </Link>
              <Link
                to="/add"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 font-arabic ${
                  isActive('/add') 
                    ? 'btn-premium text-white' 
                    : 'glass-card-light text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                إضافة اشتراك
              </Link>
              <Link
                to="/renewals"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 font-arabic ${
                  isActive('/renewals') 
                    ? 'btn-premium text-white' 
                    : 'glass-card-light text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                التجديدات القادمة
              </Link>
              <div className="flex items-center justify-between px-4 py-3 glass-card-light rounded-lg border border-premium-blue/30 mt-2">
                <div>
                  <div className="text-premium-gold text-xs font-arabic mb-1">الاشتراكات النشطة</div>
                  <div className="text-white font-bold text-xl font-arabic">{activeCount}</div>
                </div>
                <NotificationBell />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default App

