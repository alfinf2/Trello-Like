import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
    ChevronsUpDown,
    LayoutGrid,
    LogOut,
    Monitor,
    Moon,
    Settings,
    Sun,
} from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppearance } from '@/hooks/use-appearance';
import { useAuth } from '@/spa/store/auth';
import { cn } from '@/lib/utils';

const appName = import.meta.env.VITE_APP_NAME || 'Task Tracker';

function Brand(): React.JSX.Element {
    return (
        <Link to="/" className="flex items-center gap-2.5">
            <span className="text-primary-foreground from-primary to-primary/60 flex size-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm">
                <LayoutGrid className="size-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
                {appName}
            </span>
        </Link>
    );
}

function ThemeToggle(): React.JSX.Element {
    const { appearance, updateAppearance } = useAppearance();

    const options = [
        { value: 'light', label: 'Light', icon: Sun },
        { value: 'dark', label: 'Dark', icon: Moon },
        { value: 'system', label: 'System', icon: Monitor },
    ] as const;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className="focus:ring-ring border-input bg-background inline-flex size-9 items-center justify-center rounded-md border shadow-xs outline-none focus:ring-[3px]"
                aria-label="Change theme"
            >
                {appearance === 'dark' ? (
                    <Moon className="size-4" />
                ) : appearance === 'light' ? (
                    <Sun className="size-4" />
                ) : (
                    <Monitor className="size-4" />
                )}
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>Theme</DropdownMenuLabel>

                {options.map(({ value, label, icon: Icon }) => (
                    <DropdownMenuItem
                        key={value}
                        onSelect={() => updateAppearance(value)}
                    >
                        <Icon className="size-4" aria-hidden="true" />
                        {label}
                        <span
                            className={cn(
                                'ml-auto text-xs',
                                appearance === value
                                    ? 'text-foreground'
                                    : 'text-transparent',
                            )}
                        >
                            ✓
                        </span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function UserMenu(): React.JSX.Element {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const initials = (user?.name ?? 'U')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();

    const handleLogout = async (): Promise<void> => {
        await logout();
        toast.success('Signed out.');
        void navigate('/login', { replace: true });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className="focus:ring-ring border-input bg-background flex items-center gap-2 rounded-md border py-1 pr-2 pl-1 shadow-xs outline-none focus:ring-[3px]"
                aria-label="Account menu"
            >
                <Avatar className="size-7 rounded-md">
                    <AvatarFallback className="bg-primary text-primary-foreground rounded-md text-[11px] font-medium">
                        {initials}
                    </AvatarFallback>
                </Avatar>

                <span className="hidden max-w-32 truncate text-sm font-medium sm:block">
                    {user?.name}
                </span>

                <ChevronsUpDown
                    className="text-muted-foreground size-3.5"
                    aria-hidden="true"
                />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <div className="flex flex-col gap-0.5">
                        <span className="truncate text-sm">{user?.name}</span>
                        <span className="text-muted-foreground truncate text-xs font-normal">
                            {user?.email}
                        </span>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem onSelect={() => void navigate('/settings')}>
                    <Settings className="size-4" aria-hidden="true" />
                    Settings
                </DropdownMenuItem>

                <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => void handleLogout()}
                >
                    <LogOut className="size-4" aria-hidden="true" />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function AppShell(): React.JSX.Element {
    return (
        <div className="flex min-h-[100dvh] flex-col">
            <header className="bg-background/95 sticky top-0 z-20 border-b backdrop-blur">
                <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-4 sm:px-6">
                    <Brand />

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <UserMenu />
                    </div>
                </div>
            </header>

            <div className="flex-1">
                <Outlet />
            </div>
        </div>
    );
}
