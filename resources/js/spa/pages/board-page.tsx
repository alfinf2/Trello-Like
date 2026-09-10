import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Inbox, Link2, Lock } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { BoardColumns } from '@/spa/components/board/board-columns';
import { ColumnFormDialog } from '@/spa/components/board/column-form-dialog';
import { TaskDetailDialog } from '@/spa/components/board/task-detail-dialog';
import { TaskFormDialog } from '@/spa/components/board/task-form-dialog';
import { ConfirmDialog } from '@/spa/components/ui/confirm-dialog';
import {
    EmptyState,
    ErrorState,
    LoadingBlock,
} from '@/spa/components/ui/status';
import { deleteColumn, reorderColumns } from '@/spa/data/columns';
import { fetchBoard } from '@/spa/data/boards';
import { moveTask } from '@/spa/data/tasks';
import { toErrorMessage } from '@/spa/lib/errors';
import { initials } from '@/spa/lib/format';
import { useAuth } from '@/spa/store/auth';
import type { BoardDetail, Column, ColumnWithTasks, Task } from '@/spa/types';

export function BoardPage(): React.JSX.Element {
    const { boardId } = useParams<{ boardId: string }>();
    const { user } = useAuth();

    const [board, setBoard] = useState<BoardDetail | null>(null);
    const [columns, setColumns] = useState<ColumnWithTasks[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [columnForm, setColumnForm] = useState<{
        open: boolean;
        column: Column | null;
    }>({ open: false, column: null });
    const [taskColumn, setTaskColumn] = useState<ColumnWithTasks | null>(null);
    const [detailTask, setDetailTask] = useState<Task | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ColumnWithTasks | null>(
        null,
    );
    const [deleting, setDeleting] = useState(false);

    const load = useCallback(async (): Promise<void> => {
        if (boardId === undefined) {
            return;
        }

        setError(null);
        setBoard(null);

        try {
            const resolved = await fetchBoard(Number(boardId));
            setBoard(resolved);
            setColumns(resolved.columns);
        } catch (caught: unknown) {
            setError(toErrorMessage(caught));
        }
    }, [boardId]);

    useEffect(() => {
        void load();
    }, [load]);

    const canManage =
        board !== null && user !== null
            ? board.owner.id === user.id ||
              board.members.some(
                  (member) => member.id === user.id && member.role === 'admin',
              )
            : false;

    const canEdit = board !== null;

    const applyTask = (task: Task): void => {
        setColumns((current) =>
            current.map((column) =>
                column.id === task.column_id
                    ? {
                          ...column,
                          tasks: [
                              ...column.tasks.filter(
                                  (item) => item.id !== task.id,
                              ),
                              task,
                          ].sort((a, b) => a.position - b.position),
                      }
                    : column,
            ),
        );
    };

    const handleMoveTask = useCallback(
        async (
            taskId: number,
            columnId: number,
            position: number,
        ): Promise<void> => {
            try {
                const moved = await moveTask(taskId, columnId, position);

                setColumns((current) =>
                    current.map((column) => {
                        if (column.id !== columnId) {
                            return {
                                ...column,
                                tasks: column.tasks.filter(
                                    (task) => task.id !== taskId,
                                ),
                            };
                        }

                        const tasks = column.tasks
                            .filter((task) => task.id !== taskId)
                            .map((task) => ({
                                ...task,
                                position:
                                    task.position >= position
                                        ? task.position + 1
                                        : task.position,
                            }));

                        return {
                            ...column,
                            tasks: [...tasks, moved].sort(
                                (a, b) => a.position - b.position,
                            ),
                        };
                    }),
                );
            } catch (caught: unknown) {
                toast.error(toErrorMessage(caught));
                void load();
            }
        },
        [load],
    );

    const handleColumnSaved = (column: Column): void => {
        setColumns((current) => {
            const exists = current.some((item) => item.id === column.id);

            if (exists) {
                return current.map((item) =>
                    item.id === column.id
                        ? { ...item, name: column.name }
                        : item,
                );
            }

            return [...current, { ...column, tasks: [] }];
        });
    };

    const handleMoveColumn = async (
        column: ColumnWithTasks,
        direction: 'left' | 'right',
    ): Promise<void> => {
        if (columns === null) {
            return;
        }

        const index = columns.findIndex((item) => item.id === column.id);
        const target = direction === 'left' ? index - 1 : index + 1;

        if (
            index === -1 ||
            target < 0 ||
            target >= columns.length ||
            index === target
        ) {
            return;
        }

        const next = [...columns];
        [next[index], next[target]] = [next[target], next[index]];
        setColumns(next);

        try {
            await reorderColumns(
                column.board_id,
                next.map((item, position) => ({ id: item.id, position })),
            );
        } catch (caught: unknown) {
            toast.error(toErrorMessage(caught));
            void load();
        }
    };

    const handleDeleteColumn = async (): Promise<void> => {
        if (deleteTarget === null) {
            return;
        }

        setDeleting(true);

        try {
            await deleteColumn(deleteTarget.id);
            setColumns((current) =>
                current.filter((item) => item.id !== deleteTarget.id),
            );
            toast.success('Column deleted.');
            setDeleteTarget(null);
        } catch (caught: unknown) {
            toast.error(toErrorMessage(caught));
        } finally {
            setDeleting(false);
        }
    };

    const handleTaskCreated = (task: Task): void => {
        setColumns((current) =>
            current.map((column) =>
                column.id === task.column_id
                    ? {
                          ...column,
                          tasks: [...column.tasks, task].sort(
                              (a, b) => a.position - b.position,
                          ),
                      }
                    : column,
            ),
        );
    };

    const handleTaskDeleted = (taskId: number): void => {
        setColumns((current) =>
            current.map((column) => ({
                ...column,
                tasks: column.tasks.filter((task) => task.id !== taskId),
            })),
        );
    };

    if (error !== null) {
        return (
            <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6">
                <ErrorState
                    title="Could not load board"
                    description={error}
                    onRetry={() => void load()}
                />
            </main>
        );
    }

    if (board === null) {
        return (
            <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6">
                <LoadingBlock count={3} className="grid gap-4 sm:grid-cols-3" />
            </main>
        );
    }

    return (
        <main className="flex h-[calc(100dvh-4rem)] flex-col">
            <header className="bg-background/95 z-10 border-b backdrop-blur">
                <div className="flex h-16 flex-wrap items-center gap-x-4 gap-y-2 px-4 sm:px-6">
                    <Link
                        to="/"
                        className="hover:text-foreground text-muted-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-md text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[3px]"
                    >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        Boards
                    </Link>

                    <span className="bg-border h-5 w-px" aria-hidden="true" />

                    <div className="min-w-0">
                        <h1 className="flex items-center gap-2 truncate text-base font-semibold tracking-tight">
                            {board.name}
                            {board.visibility === 'private' ? (
                                <Lock
                                    className="text-muted-foreground size-3.5"
                                    aria-label="Private board"
                                />
                            ) : (
                                <Link2
                                    className="text-muted-foreground size-3.5"
                                    aria-label="Public board"
                                />
                            )}
                        </h1>

                        {board.description !== null &&
                        board.description !== '' ? (
                            <p className="text-muted-foreground truncate text-xs">
                                {board.description}
                            </p>
                        ) : null}
                    </div>

                    {user !== null && (
                        <div className="ml-auto flex items-center">
                            {[board.owner, ...board.members].map((member) => (
                                <Tooltip key={member.id}>
                                    <TooltipTrigger asChild>
                                        <Avatar className="border-background -ml-1.5 size-7 rounded-full border-2 first:ml-0">
                                            <AvatarFallback className="rounded-full text-[10px] font-medium">
                                                {initials(member.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {member.name}
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            <div className="min-h-0 flex-1">
                {columns.length === 0 ? (
                    <div className="flex h-full items-start overflow-y-auto p-6">
                        <EmptyState
                            icon={Inbox}
                            title="No columns yet"
                            description="Add a column to start organizing tasks."
                            action={
                                canManage ? (
                                    <Button
                                        onClick={() =>
                                            setColumnForm({
                                                open: true,
                                                column: null,
                                            })
                                        }
                                    >
                                        Add column
                                    </Button>
                                ) : undefined
                            }
                        />
                    </div>
                ) : (
                    <BoardColumns
                        columns={columns}
                        canManage={canManage}
                        canEdit={canEdit}
                        onColumnsChange={setColumns}
                        onMoveTask={handleMoveTask}
                        onAddTask={setTaskColumn}
                        onAddColumn={() =>
                            setColumnForm({ open: true, column: null })
                        }
                        onRename={(column) =>
                            setColumnForm({ open: true, column })
                        }
                        onMoveColumn={handleMoveColumn}
                        onDeleteColumn={setDeleteTarget}
                        onOpenTask={setDetailTask}
                    />
                )}
            </div>

            <ColumnFormDialog
                open={columnForm.open}
                onOpenChange={(open) =>
                    setColumnForm((current) => ({ ...current, open }))
                }
                boardId={board.id}
                column={columnForm.column}
                onSaved={handleColumnSaved}
            />

            {taskColumn !== null ? (
                <TaskFormDialog
                    open
                    onOpenChange={(open) => {
                        if (!open) {
                            setTaskColumn(null);
                        }
                    }}
                    board={board}
                    column={taskColumn}
                    onSaved={handleTaskCreated}
                />
            ) : null}

            <TaskDetailDialog
                task={detailTask}
                board={board}
                open={detailTask !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDetailTask(null);
                    }
                }}
                onChanged={applyTask}
                onDeleted={handleTaskDeleted}
            />

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                    }
                }}
                title="Delete column?"
                description={
                    deleteTarget === null
                        ? undefined
                        : `“${deleteTarget.name}” and its ${deleteTarget.tasks.length} task${deleteTarget.tasks.length === 1 ? '' : 's'} will be permanently removed.`
                }
                confirmLabel="Delete column"
                isLoading={deleting}
                onConfirm={() => void handleDeleteColumn()}
            />
        </main>
    );
}
