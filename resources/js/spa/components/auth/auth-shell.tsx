import { LayoutGrid } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

const appName = import.meta.env.VITE_APP_NAME || 'Task Tracker';

export function AuthShell({
    title,
    subtitle,
    children,
    footer,
}: {
    title: string;
    subtitle: string;
    children: ReactNode;
    footer: ReactNode;
}): React.JSX.Element {
    return (
        <div className="mx-auto flex w-full max-w-sm flex-col">
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
                <Link
                    to="/login"
                    className="text-primary-foreground from-primary to-primary/60 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm"
                >
                    <LayoutGrid className="size-5" aria-hidden="true" />
                </Link>

                <div className="space-y-1.5">
                    <h1 className="text-xl font-semibold tracking-tight">
                        {title}
                    </h1>
                    <p className="text-muted-foreground text-sm">{subtitle}</p>
                </div>
            </div>

            <div className="bg-card rounded-xl border p-6 shadow-xs">
                {children}
            </div>

            <p className="text-muted-foreground mt-6 text-center text-sm">
                {footer} ·{' '}
                <span className="text-foreground font-medium">{appName}</span>
            </p>
        </div>
    );
}

export function AuthError({
    message,
}: {
    message: string | null;
}): React.JSX.Element | null {
    if (message === null) {
        return null;
    }

    return (
        <div
            role="alert"
            className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
        >
            {message}
        </div>
    );
}
