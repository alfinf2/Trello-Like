import type { Activity, TaskPriority } from '@/spa/types';

const PRIORITY_LABEL: Record<TaskPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
};

export const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABEL).map(
    ([value, label]) => ({ value: value as TaskPriority, label }),
);

export function priorityLabel(priority: TaskPriority): string {
    return PRIORITY_LABEL[priority];
}

export function formatDueDate(value: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

    if (match === null) {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toISOString().slice(0, 10);
    }

    return `${match[1]}-${match[2]}-${match[3]}`;
}

export function dueDateStatus(value: string | null): {
    label: string;
    overdue: boolean;
    tone: 'danger' | 'warning' | 'neutral';
} {
    if (value === null || value === '') {
        return { label: '', overdue: false, tone: 'neutral' };
    }

    const due = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const normalized = new Date(due);
    normalized.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
        (normalized.getTime() - today.getTime()) / 86_400_000,
    );

    if (diffDays < 0) {
        return {
            label: `${Math.abs(diffDays)}d overdue`,
            overdue: true,
            tone: 'danger',
        };
    }

    if (diffDays === 0) {
        return { label: 'Due today', overdue: false, tone: 'warning' };
    }

    if (diffDays === 1) {
        return { label: 'Due tomorrow', overdue: false, tone: 'warning' };
    }

    return {
        label: `${formatDueDate(value)}`,
        overdue: false,
        tone: 'neutral',
    };
}

export function activityLabel(activity: Activity): string {
    const user = activity.user?.name ?? 'Someone';

    switch (activity.type) {
        case 'created':
            return `${user} created this task`;
        case 'updated':
            return `${user} updated this task`;
        case 'moved':
            return `${user} moved this task`;
        case 'deleted':
            return `${user} deleted this task`;
        default:
            return `${user} made a change`;
    }
}

export function formatDateTime(value: string | null): string {
    if (value === null || value === '') {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

export function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}
