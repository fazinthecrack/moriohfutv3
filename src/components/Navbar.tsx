import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Home, Store, Package, LogOut, Users, Backpack, Swords } from 'lucide-react';
import logoWide from '@/assets/logo-wide.png';
import logoSmall from '@/assets/logo-small.png';

const NAV_ITEMS = [
  { path: '/', label: 'Accueil', icon: Home },
  { path: '/packs', label: 'Packs', icon: Package },
  { path: '/inventory', label: 'Inventaire', icon: Backpack },
  { path: '/lineup', label: 'Compo', icon: Users },
  { path: '/versus', label: '1v1', icon: Swords },
  { path: '/market', label: 'Marché', icon: Store },
];

export function Navbar() {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center px-4 sm:px-8 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <Link to="/" className="mr-6 flex items-center flex-shrink-0">
        <img src={logoWide} alt="Morioh Ultimate Team" className="h-32 hidden md:block" />
        <img src={logoSmall} alt="MUT" className="h-32 md:hidden" />
      </Link>

      <div className="flex items-center gap-1 flex-1 overflow-x-auto">
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-display tracking-wider hidden sm:inline text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 backdrop-blur">
          <span className="text-primary font-mono-stats text-base font-semibold">{profile?.credits ?? 0}</span>
          <span className="text-xs text-muted-foreground">crédits</span>
        </div>
        <span className="text-sm text-foreground hidden sm:inline font-medium">{profile?.username}</span>
        <button onClick={signOut} className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
