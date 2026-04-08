import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Mountain, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState } from 'react';

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <Mountain className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Nepal Stays</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-4 md:flex">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Hotels</Link>
          {!isAdmin && <Link to="/list-your-hotel" className="text-sm text-muted-foreground hover:text-foreground">List Your Hotel</Link>}
          {!isAdmin && user && <Link to="/my-profile" className="text-sm text-muted-foreground hover:text-foreground">My Profile</Link>}
          {isAdmin && <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">Admin</Link>}
          <ThemeToggle />
          {user ? (
            <Button variant="outline" size="sm" onClick={handleSignOut}>Sign Out</Button>
          ) : (
            <Button size="sm" onClick={() => navigate('/auth')}>Sign In</Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/" className="text-sm text-muted-foreground" onClick={() => setMenuOpen(false)}>Hotels</Link>
            {!isAdmin && <Link to="/list-your-hotel" className="text-sm text-muted-foreground" onClick={() => setMenuOpen(false)}>List Your Hotel</Link>}
            {!isAdmin && user && <Link to="/my-profile" className="text-sm text-muted-foreground" onClick={() => setMenuOpen(false)}>My Profile</Link>}
            {isAdmin && <Link to="/admin" className="text-sm text-muted-foreground" onClick={() => setMenuOpen(false)}>Admin</Link>}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            {user ? (
              <Button variant="outline" size="sm" onClick={() => { handleSignOut(); setMenuOpen(false); }}>Sign Out</Button>
            ) : (
              <Button size="sm" onClick={() => { navigate('/auth'); setMenuOpen(false); }}>Sign In</Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
