import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Phone, History, LayoutDashboard, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Logo } from '@/components/ui/Logo';

export default function AppLayout() {
    const navigate = useNavigate();
    const { data: currentUser } = useCurrentUser();

    const isAdmin = currentUser?.role === 'admin';

    const handleLogout = () => {
        localStorage.removeItem('token');
        toast.info('Logged out');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950 text-white shadow-sm">
                <div className="container flex h-16 items-center justify-between">
                    <div className="mr-8 flex items-center">
                        <a className="mr-6 flex items-center space-x-2 font-bold tracking-tight" href="/">
                            <Logo className="h-8 w-8 text-primary" />
                            <span className="text-xl">PAYLINE</span>
                        </a>
                        <nav className="flex items-center space-x-1">
                            <NavLink
                                to="/"
                                end
                                className={({ isActive }) =>
                                    `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10 ${isActive ? 'bg-white/10 text-primary' : 'text-zinc-400 hover:text-white'}`
                                }
                            >
                                <Phone className="h-4 w-4" />
                                New Call
                            </NavLink>
                            <NavLink
                                to="/history"
                                className={({ isActive }) =>
                                    `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10 ${isActive ? 'bg-white/10 text-primary' : 'text-zinc-400 hover:text-white'}`
                                }
                            >
                                <History className="h-4 w-4" />
                                History
                            </NavLink>
                            <NavLink
                                to="/dashboard"
                                className={({ isActive }) =>
                                    `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10 ${isActive ? 'bg-white/10 text-primary' : 'text-zinc-400 hover:text-white'}`
                                }
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </NavLink>
                            {isAdmin && (
                                <NavLink
                                    to="/users"
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10 ${isActive ? 'bg-white/10 text-primary' : 'text-zinc-400 hover:text-white'}`
                                    }
                                >
                                    <Users className="h-4 w-4" />
                                    Users
                                </NavLink>
                            )}
                        </nav>
                    </div>
                    <div className="flex items-center justify-end space-x-4">
                        {currentUser && (
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-medium text-white">
                                    {currentUser.username}
                                </span>
                                <span className="text-xs text-zinc-400 capitalize">
                                    {currentUser.role}
                                </span>
                            </div>
                        )}
                        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" className="text-zinc-400 hover:bg-white/10 hover:text-white">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>
            <main className="flex-1 bg-muted/20">
                <div className="container py-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
