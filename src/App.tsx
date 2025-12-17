import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Users, Sword, Map as MapIcon, Settings, FileText, Globe, ShoppingCart } from 'lucide-react';
import OverviewPage from './pages/OverviewPage';
import CombatPage from './pages/CombatPage';
import MapPage from './pages/MapPage';
import ManagerPage from './pages/ManagerPage';
import EventLogPage from './pages/EventLogPage';
import ShopPage from './pages/ShopPage';
import clsx from 'clsx';
import { useGameStore } from './store/gameStore';
import { translations } from './i18n/translations';

function NavItem({ to, icon: Icon, label }: { to: string, icon: any, label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={clsx(
        "flex items-center gap-3 p-3 rounded transition font-medium",
        isActive ? "bg-red-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
      )}
    >
      <Icon size={20} /> {label}
    </Link>
  );
}

function AppContent() {
  const { language, setLanguage } = useGameStore();
  const t = translations[language || 'en'];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex font-sans">
      {/* Sidebar */}
      <nav className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col gap-2 shrink-0">
        <div className="mb-8 px-2">
          <h1 className="text-2xl font-black text-white tracking-tighter">{t.nav.title}</h1>
          <p className="text-xs text-red-500 font-mono tracking-widest">{t.nav.subtitle}</p>
        </div>
        
        <NavItem to="/" icon={Users} label={t.nav.overview} />
        <NavItem to="/combat" icon={Sword} label={t.nav.combat} />
        <NavItem to="/map" icon={MapIcon} label={t.nav.exploration} />
        <NavItem to="/shop" icon={ShoppingCart} label="商店" />
        <NavItem to="/manager" icon={Settings} label={t.nav.manager} />
        <NavItem to="/logs" icon={FileText} label={t.nav.eventLogs} />

        <div className="mt-auto pt-4 border-t border-gray-800">
           <button 
             onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
             className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
           >
             <Globe size={16} /> {language === 'en' ? 'Switch to 中文' : 'Switch to English'}
           </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/combat" element={<CombatPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/manager" element={<ManagerPage />} />
            <Route path="/logs" element={<EventLogPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;