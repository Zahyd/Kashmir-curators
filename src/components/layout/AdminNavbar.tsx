import { Link } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function AdminNavbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-card/95 backdrop-blur-md shadow-md border-b border-kashmir-gold/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/admin" className="flex items-center group">
            <Logo className="h-16 w-auto" />
          </Link>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right mr-2">
              <div className="text-sm font-medium text-foreground">Admin Portal</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-kashmir-gold/30 hover:bg-kashmir-gold/10">
                  <User className="h-4 w-4 text-kashmir-gold" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="text-muted-foreground" disabled>
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-500 hover:text-red-600 focus:text-red-600 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
