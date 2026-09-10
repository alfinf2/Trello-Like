import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function LoadingBlock({
    className,
    count = 3,
}: {
    className?: string;
    count?: number;
}): React.JSX.Element {
    return (
        <div
            className={cn('animate-pulse space-y-3', className)}
            aria-busy="true"
            aria-label="Loading"
        >
            {Array.from({ length: count }, (_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
            ))}
        </div>
    );
}

export function EmptyState({
    icon: Icon = Inbox,
    title,
    description,
    action,
}: {
    icon?: typeof Inbox;
    title: string;
    description?: string;
    action?: ReactNode;
}): React.JSX.Element {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
            <span className="bg-muted text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-full">
                <Icon className="size-6" aria-hidden="true" />
            </span>

            <h3 className="text-sm font-semibold">{title}</h3>

            {description !== undefined ? (
                <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                    {description}
                </p>
            ) : null}

            {action !== undefined ? <div className="mt-5">{action}</div> : null}
        </div>
    );
}

export function ErrorState({
    title = 'Something went wrong',
    description,
    onRetry,
}: {
    title?: string;
    description?: string;
    onRetry?: () => void;
}): React.JSX.Element {
    return (
        <div className="border-destructive/40 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
            <span className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-full">
                <AlertTriangle className="size-6" aria-hidden="true" />
            </span>

            <h3 className="text-sm font-semibold">{title}</h3>

            {description !== undefined ? (
                <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                    {description}
                </p>
            ) : null}

            {onRetry !== undefined ? (
                <Button variant="outline" className="mt-5" onClick={onRetry}>
                    <RefreshCw className="size-4" aria-hidden="true" />
                    Try again
                </Button>
            ) : null}
        </div>
    );
}
