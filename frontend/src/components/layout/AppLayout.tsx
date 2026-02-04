import { useState, useEffect } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Phone, History, LayoutDashboard, Users, Clock, BookOpen, FileQuestion } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Logo } from '@/components/ui/Logo';

function LiveClock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const formattedTime = time.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const formattedDate = time.toLocaleDateString('ru-RU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900 rounded-xl border border-zinc-800">
            <Clock className="w-4 h-4 text-primary" />
            <div className="flex flex-col items-end">
                <span className="text-lg font-mono font-bold tabular-nums text-white tracking-wider">
                    {formattedTime}
                </span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                    {formattedDate}
                </span>
            </div>
        </div>
    );
}

export default function AppLayout() {
    const navigate = useNavigate();
    const { data: currentUser } = useCurrentUser();

    const overrideUntil = currentUser?.role_override_until
        ? new Date(currentUser.role_override_until)
        : null;
    const hasActiveOverride = !!(
        currentUser?.role_override &&
        overrideUntil &&
        overrideUntil.getTime() > Date.now()
    );
    const effectiveRole = currentUser?.effective_role ?? currentUser?.role;
    const isPrivileged = effectiveRole === 'admin' || effectiveRole === 'supervisor';
    const roleLabel =
        effectiveRole === 'admin'
            ? 'Администратор'
            : effectiveRole === 'supervisor'
                ? 'Супервизор'
                : 'Оператор';
    const roleSuffix = hasActiveOverride ? ' (временно)' : '';

    const handleLogout = () => {
        localStorage.removeItem('token');
        toast.info('Вы вышли из системы');
        navigate('/login');
    };

    return (
        <div className="h-screen bg-background font-sans antialiased flex flex-col overflow-hidden">
            {/* Header - Always visible */}
            <header className="shrink-0 h-16 w-full border-b border-white/10 bg-zinc-950 text-white">
                <div className="h-full px-4 flex items-center justify-between">
                    {/* Left: Logo & Navigation */}
                    <div className="flex items-center gap-6">
                        <a className="flex items-center gap-2 font-bold tracking-tight" href="/">
                            <Logo className="h-8 w-8 text-primary" />
                            <span className="text-xl">PAYLINE</span>
                        </a>

                        <nav className="flex items-center gap-1 ml-4">
                            <NavLink
                                to="/"
                                end
                                className={({ isActive }) =>
                                    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                                    }`
                                }
                            >
                                <Phone className="h-4 w-4" />
                                Звонок
                            </NavLink>
                            <NavLink
                                to="/history"
                                className={({ isActive }) =>
                                    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                                    }`
                                }
                            >
                                <History className="h-4 w-4" />
                                История
                            </NavLink>
                            <NavLink
                                to="/dashboard"
                                className={({ isActive }) =>
                                    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                                    }`
                                }
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Дашборд
                            </NavLink>
                            {isPrivileged && (
                                <NavLink
                                    to="/users"
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                                        }`
                                    }
                                >
                                    <Users className="h-4 w-4" />
                                    Пользователи
                                </NavLink>
                            )}
                            {isPrivileged && (
                                <NavLink
                                    to="/directories"
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                                        }`
                                    }
                                >
                                    <BookOpen className="h-4 w-4" />
                                    Справочники
                                </NavLink>
                            )}
                            {isPrivileged && (
                                <NavLink
                                    to="/scripts-review"
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                                        }`
                                    }
                                >
                                    <FileQuestion className="h-4 w-4" />
                                    Ревью
                                </NavLink>
                            )}
                        </nav>
                    </div>

                    {/* Right: Clock, User, Logout */}
                    <div className="flex items-center gap-4">
                        <LiveClock />

                        {currentUser && (
                            <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-medium text-white">
                                        {currentUser.username}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                                        {roleLabel}
                                        {roleSuffix}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleLogout}
                                    title="Выйти"
                                    className="text-zinc-400 hover:bg-white/10 hover:text-white"
                                >
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content - allow page scroll */}
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}
