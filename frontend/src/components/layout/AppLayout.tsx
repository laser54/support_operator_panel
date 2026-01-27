import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Phone, History, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';

export default function AppLayout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        toast.info('Logged out');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                    <div className="mr-4 flex items-center">
                        <a className="mr-6 flex items-center space-x-2 font-bold" href="/">
                            <span>PAYLINE Support</span>
                        </a>
                        <nav className="flex items-center space-x-6 text-sm font-medium">
                            <NavLink
                                to="/"
                                end
                                className={({ isActive }) =>
                                    `flex items-center gap-2 transition-colors hover:text-foreground/80 ${isActive ? 'text-foreground' : 'text-foreground/60'}`
                                }
                            >
                                <Phone className="h-4 w-4" />
                                New Call
                            </NavLink>
                            <NavLink
                                to="/history"
                                className={({ isActive }) =>
                                    `flex items-center gap-2 transition-colors hover:text-foreground/80 ${isActive ? 'text-foreground' : 'text-foreground/60'}`
                                }
                            >
                                <History className="h-4 w-4" />
                                History
                            </NavLink>
                            <NavLink
                                to="/dashboard"
                                className={({ isActive }) =>
                                    `flex items-center gap-2 transition-colors hover:text-foreground/80 ${isActive ? 'text-foreground' : 'text-foreground/60'}`
                                }
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </NavLink>
                        </nav>
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>
            <main className="flex-1">
                <div className="container py-6 h-[calc(100vh-3.5rem)]">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
