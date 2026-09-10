import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { AppShell } from '@/spa/components/shell/app-shell';
import { BoardPage } from '@/spa/pages/board-page';
import { DashboardPage } from '@/spa/pages/dashboard-page';
import { ForgotPasswordPage } from '@/spa/pages/forgot-password-page';
import { LoginPage } from '@/spa/pages/login-page';
import { RegisterPage } from '@/spa/pages/register-page';
import { ResetPasswordPage } from '@/spa/pages/reset-password-page';
import { SettingsPage } from '@/spa/pages/settings-page';
import { useAuth } from '@/spa/store/auth';

function ProtectedLayout(): React.JSX.Element {
    const { status } = useAuth();

    if (status === 'loading') {
        return (
            <div className="text-muted-foreground flex min-h-[100dvh] items-center justify-center text-sm">
                Loading…
            </div>
        );
    }

    if (status === 'guest') {
        return <Navigate to="/login" replace />;
    }

    return <AppShell />;
}

function GuestLayout(): React.JSX.Element {
    const { status } = useAuth();

    if (status === 'loading') {
        return (
            <div className="text-muted-foreground flex min-h-[100dvh] items-center justify-center text-sm">
                Loading…
            </div>
        );
    }

    if (status === 'authenticated') {
        return <Navigate to="/" replace />;
    }

    return (
        <main className="relative isolate flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-12">
            <div
                className="pointer-events-none absolute inset-0 -z-10"
                aria-hidden="true"
                style={{
                    background:
                        'radial-gradient(70% 45% at 50% 0%, color-mix(in oklab, var(--primary) 9%, transparent), transparent 70%)',
                }}
            />
            <Outlet />
        </main>
    );
}

export function App(): React.JSX.Element {
    return (
        <Routes>
            <Route element={<GuestLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            <Route element={<ProtectedLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="/boards/:boardId" element={<BoardPage />} />
                <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
