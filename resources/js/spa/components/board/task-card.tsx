import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarClock, Check, Flag } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { taskDndId } from '@/spa/lib/dnd-ids';
import { dueDateStatus, initials, PRIORITY_OPTIONS } from '@/spa/lib/format';
import type { Task } from '@/spa/types';

const PRIORITY_TONE: Record<string, string> = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-primary/10 text-primary',
    high: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    urgent: 'bg-destructive/10 text-destructive',
};

function PriorityBadge({
    priority,
}: {
    priority: Task['priority'];
}): React.JSX.Element {
    const option = PRIORITY_OPTIONS.find((item) => item.value === priority);

    if (option === undefined) {
        return <></>;
    }

    return (
        <Badge
            variant="outline"
            className={cn(
                'gap-1 border-none px-1.5 py-0 font-normal',
                PRIORITY_TONE[priority],
            )}
        >
            <Flag className="size-3" aria-hidden="true" />
            {option.label}
        </Badge>
    );
}

function DueBadge({
    dueDate,
    isCompleted,
}: {
    dueDate: string | null;
    isCompleted: boolean;
}): React.JSX.Element | null {
    const status = dueDateStatus(dueDate);

    if (isCompleted || status.label === '') {
        return null;
    }

    return (
        <Badge
            variant="outline"
            className={cn(
                'gap-1 border-none px-1.5 py-0 font-normal',
                status.tone === 'danger' &&
                    'bg-destructive/10 text-destructive',
                status.tone === 'warning' &&
                    'bg-amber-500/15 text-amber-700 dark:text-amber-400',
                status.tone === 'neutral' && 'bg-muted text-muted-foreground',
            )}
        >
            <CalendarClock className="size-3" aria-hidden="true" />
            {status.label}
        </Badge>
    );
}

export function TaskCardContent({ task }: { task: Task }): React.JSX.Element {
    const isOverdue =
        !task.is_completed &&
        (dueDateStatus(task.due_date).tone === 'danger' ||
            dueDateStatus(task.due_date).tone === 'warning');

    return (
        <div className="space-y-2">
            <div className="flex items-start gap-2">
                <p
                    className={cn(
                        'line-clamp-2 flex-1 text-sm',
                        task.is_completed &&
                            'text-muted-foreground line-through',
                    )}
                >
                    {task.title}
                </p>

                {task.is_completed ? (
                    <Check
                        className="text-primary mt-0.5 size-4 shrink-0"
                        aria-label="Completed"
                    />
                ) : null}
            </div>

            {task.labels.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                    {task.labels.map((label) => (
                        <span
                            key={label.id}
                            className="h-2 w-6 rounded-full"
                            style={{ backgroundColor: label.color }}
                            title={label.name}
                        />
                    ))}
                </div>
            ) : null}

            {task.description !== null && task.description !== '' ? (
                <p className="text-muted-foreground line-clamp-2 text-xs">
                    {task.description}
                </p>
            ) : null}

            <div className="flex items-center gap-1.5 pt-0.5">
                <PriorityBadge priority={task.priority} />
                <DueBadge
                    dueDate={task.due_date}
                    isCompleted={task.is_completed}
                />

                <span className="flex-1" />

                {task.assignee !== null ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Avatar
                                className={cn(
                                    'size-6 rounded-full',
                                    isOverdue && 'ring-destructive/60 ring-2',
                                )}
                            >
                                <AvatarFallback className="rounded-full text-[10px] font-medium">
                                    {initials(task.assignee.name)}
                                </AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>{task.assignee.name}</TooltipContent>
                    </Tooltip>
                ) : null}
            </div>
        </div>
    );
}

export function SortableTaskCard({
    task,
    onOpen,
    disabled = false,
}: {
    task: Task;
    onOpen: (task: Task) => void;
    disabled?: boolean;
}): React.JSX.Element {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: taskDndId(task.id),
        data: { type: 'task', taskId: task.id },
        disabled,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={`Open task: ${task.title}`}
            className={cn(
                'focus:ring-ring bg-card hover:border-primary/40 cursor-grab rounded-lg border p-3 shadow-xs transition-[box-shadow,opacity] outline-none focus-visible:ring-2 active:cursor-grabbing',
                isDragging && 'z-10 opacity-50',
            )}
            onClick={() => onOpen(task)}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpen(task);
                }
            }}
        >
            <TaskCardContent task={task} />
        </div>
    );
}
