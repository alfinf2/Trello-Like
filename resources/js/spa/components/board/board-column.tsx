import { useDroppable } from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { SortableTaskCard } from '@/spa/components/board/task-card';
import { columnDndId, taskDndId } from '@/spa/lib/dnd-ids';
import type { ColumnWithTasks, Task } from '@/spa/types';

export function BoardColumn({
    column,
    isOver,
    canManage,
    canEdit,
    onAddTask,
    onRename,
    onMove,
    onDelete,
    onOpenTask,
}: {
    column: ColumnWithTasks;
    isOver: boolean;
    canManage: boolean;
    canEdit: boolean;
    onAddTask: (column: ColumnWithTasks) => void;
    onRename: (column: ColumnWithTasks) => void;
    onMove: (column: ColumnWithTasks, direction: 'left' | 'right') => void;
    onDelete: (column: ColumnWithTasks) => void;
    onOpenTask: (task: Task) => void;
}): React.JSX.Element {
    const { setNodeRef } = useDroppable({
        id: columnDndId(column.id),
        data: { type: 'column', columnId: column.id },
    });

    return (
        <section
            ref={setNodeRef}
            className={cn(
                'bg-muted/40 flex w-72 shrink-0 flex-col rounded-xl border transition-colors',
                isOver && 'border-primary/60 bg-primary/5',
            )}
            aria-label={`Column: ${column.name}`}
        >
            <header className="flex items-center gap-1 px-3 py-2.5">
                <h2 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">
                    {column.name}
                </h2>

                <span className="text-muted-foreground text-xs tabular-nums">
                    {column.tasks.length}
                </span>

                {canEdit ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Add task to ${column.name}`}
                        onClick={() => onAddTask(column)}
                    >
                        <Plus className="size-4" />
                    </Button>
                ) : null}

                {canManage ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            className="focus:ring-ring text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex size-7 items-center justify-center rounded-md outline-none focus-visible:ring-[3px]"
                            aria-label={`Column ${column.name} actions`}
                        >
                            <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => onMove(column, 'left')}
                            >
                                <ChevronLeft
                                    className="size-4"
                                    aria-hidden="true"
                                />
                                Move left
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() => onMove(column, 'right')}
                            >
                                <ChevronRight
                                    className="size-4"
                                    aria-hidden="true"
                                />
                                Move right
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => onRename(column)}>
                                <Pencil className="size-4" aria-hidden="true" />
                                Rename column
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => onDelete(column)}
                            >
                                <Trash2 className="size-4" aria-hidden="true" />
                                Delete column
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}
            </header>

            <div
                className="flex min-h-6 flex-1 flex-col gap-2 overflow-y-auto p-2"
                style={{ maxHeight: 'calc(100dvh - 14rem)' }}
            >
                <SortableContext
                    items={column.tasks.map((task) => taskDndId(task.id))}
                    strategy={verticalListSortingStrategy}
                >
                    {column.tasks.map((task) => (
                        <SortableTaskCard
                            key={task.id}
                            task={task}
                            onOpen={onOpenTask}
                            disabled={!canEdit}
                        />
                    ))}

                    {column.tasks.length === 0 ? (
                        <p className="text-muted-foreground/70 px-2 py-1 text-xs">
                            No tasks — drag cards here.
                        </p>
                    ) : null}
                </SortableContext>
            </div>
        </section>
    );
}
