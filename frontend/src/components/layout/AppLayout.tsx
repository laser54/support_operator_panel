import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
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
                    <div className="mr-4 hidden md:flex">
                        <a className="mr-6 flex items-center space-x-2 font-bold" href="/">
                            <span>PAYLINE Support</span>
                        </a>
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
