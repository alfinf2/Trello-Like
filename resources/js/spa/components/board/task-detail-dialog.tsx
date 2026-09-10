import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
    CalendarClock,
    Check,
    Flag,
    History,
    Pencil,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/spa/components/ui/confirm-dialog';
import { getAssignees } from '@/spa/components/board/task-form-dialog';
import { fieldErrorsOf } from '@/spa/components/board/column-form-dialog';
import { attachLabels, detachLabel } from '@/spa/data/labels';
import { deleteTask, fetchTask, updateTask } from '@/spa/data/tasks';
import { getFieldError, toErrorMessage } from '@/spa/lib/errors';
import {
    activityLabel,
    dueDateStatus,
    formatDateTime,
    formatDueDate,
    initials,
    priorityLabel,
    PRIORITY_OPTIONS,
} from '@/spa/lib/format';
import type { BoardDetail, Task, TaskDetail, TaskPriority } from '@/spa/types';
import { cn } from '@/lib/utils';

const TEXTAREA_CLASS =
    'border-input placeholder:text-muted-foreground min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]';

export function TaskDetailDialog({
    task,
    board,
    open,
    onOpenChange,
    onChanged,
    onDeleted,
}: {
    task: Task | null;
    board: BoardDetail;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onChanged: (task: Task) => void;
    onDeleted: (taskId: number) => void;
}): React.JSX.Element {
    const [detail, setDetail] = useState<TaskDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [labelBusy, setLabelBusy] = useState<number | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [dueDate, setDueDate] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );

    const assignees = getAssignees(board);

    const load = useCallback(async (taskId: number): Promise<void> => {
        setLoading(true);
        setLoadError(null);

        try {
            setDetail(await fetchTask(taskId));
        } catch (caught: unknown) {
            setLoadError(toErrorMessage(caught));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!open || task === null) {
            return;
        }

        setEditing(false);
        setConfirmDelete(false);
        setFormError(null);
        setFieldErrors({});
        void load(task.id);
    }, [open, task, load]);

    const startEditing = (): void => {
        if (detail === null) {
            return;
        }

        setTitle(detail.title);
        setDescription(detail.description ?? '');
        setPriority(detail.priority);
        setDueDate(
            detail.due_date === null ? '' : formatDueDate(detail.due_date),
        );
        setAssigneeId(
            detail.assignee === null ? 'none' : String(detail.assignee.id),
        );
        setFormError(null);
        setFieldErrors({});
        setEditing(true);
    };

    const announce = useCallback(
        (updated: Task): void => {
            setDetail((current) =>
                current === null ? null : { ...current, ...updated },
            );
            onChanged(updated);
        },
        [onChanged],
    );

    const handleToggleComplete = async (): Promise<void> => {
        if (detail === null || isToggling) {
            return;
        }

        setIsToggling(true);

        try {
            const updated = await updateTask(detail.id, {
                is_completed: !detail.is_completed,
            });
            announce(updated);
            toast.success(
                updated.is_completed ? 'Task completed.' : 'Task reopened.',
            );
        } catch (caught: unknown) {
            toast.error(toErrorMessage(caught));
        } finally {
            setIsToggling(false);
        }
    };

    const handleUpdate = async (
        event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        event.preventDefault();

        if (detail === null) {
            return;
        }

        setFormError(null);
        setFieldErrors({});
        setIsSaving(true);

        try {
            const updated = await updateTask(detail.id, {
                title,
                description: description === '' ? null : description,
                priority,
                due_date: dueDate === '' ? null : dueDate,
                assignee_id: assigneeId === 'none' ? null : Number(assigneeId),
            });

            announce(updated);
            setEditing(false);
            toast.success('Task updated.');
        } catch (caught: unknown) {
            setFormError(toErrorMessage(caught));
            setFieldErrors(fieldErrorsOf(caught));
        } finally {
            setIsSaving(false);
        }
    };

    const toggleLabel = async (labelId: number): Promise<void> => {
        if (detail === null || labelBusy !== null) {
            return;
        }

        setLabelBusy(labelId);

        try {
            const attached = detail.labels.some(
                (label) => label.id === labelId,
            );

            let labels = [...detail.labels];

            if (attached) {
                await detachLabel(detail.id, labelId);
                labels = labels.filter((label) => label.id !== labelId);
            } else {
                labels = await attachLabels(detail.id, [
                    ...labels.map((label) => label.id),
                    labelId,
                ]);
            }

            const nextDetail: TaskDetail = { ...detail, labels };
            setDetail(nextDetail);
            onChanged(nextDetail);
        } catch (caught: unknown) {
            toast.error(toErrorMessage(caught));
        } finally {
            setLabelBusy(null);
        }
    };

    const handleDelete = async (): Promise<void> => {
        if (detail === null) {
            return;
        }

        setDeleting(true);

        try {
            await deleteTask(detail.id);
            toast.success('Task deleted.');
            onDeleted(detail.id);
            onOpenChange(false);
        } catch (caught: unknown) {
            toast.error(toErrorMessage(caught));
            setConfirmDelete(false);
        } finally {
            setDeleting(false);
        }
    };

    const due = detail === null ? null : dueDateStatus(detail.due_date);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-lg">
                    {editing && detail !== null ? (
                        <>
                            <DialogHeader>
                                <DialogTitle>Edit task</DialogTitle>
                                <DialogDescription>
                                    Update the details of this task.
                                </DialogDescription>
                            </DialogHeader>

                            <form
                                onSubmit={(event) => void handleUpdate(event)}
                                className="space-y-4"
                                noValidate
                            >
                                {formError !== null ? (
                                    <div
                                        role="alert"
                                        className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
                                    >
                                        {formError}
                                    </div>
                                ) : null}

                                <div className="space-y-2">
                                    <Label htmlFor="edit-task-title">
                                        Title
                                    </Label>
                                    <Input
                                        id="edit-task-title"
                                        type="text"
                                        required
                                        maxLength={191}
                                        value={title}
                                        onChange={(event) =>
                                            setTitle(event.target.value)
                                        }
                                        aria-invalid={
                                            getFieldError(
                                                { errors: fieldErrors },
                                                'title',
                                            ) !== undefined
                                        }
                                    />
                                    {getFieldError(
                                        { errors: fieldErrors },
                                        'title',
                                    ) !== undefined ? (
                                        <p className="text-destructive text-sm">
                                            {getFieldError(
                                                { errors: fieldErrors },
                                                'title',
                                            )}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-task-description">
                                        Description
                                    </Label>
                                    <textarea
                                        id="edit-task-description"
                                        maxLength={10000}
                                        className={TEXTAREA_CLASS}
                                        value={description}
                                        onChange={(event) =>
                                            setDescription(event.target.value)
                                        }
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-task-priority">
                                            Priority
                                        </Label>
                                        <Select
                                            value={priority}
                                            onValueChange={(value) =>
                                                setPriority(
                                                    value as TaskPriority,
                                                )
                                            }
                                        >
                                            <SelectTrigger
                                                id="edit-task-priority"
                                                className="w-full"
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PRIORITY_OPTIONS.map(
                                                    (option) => (
                                                        <SelectItem
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="edit-task-due">
                                            Due date
                                        </Label>
                                        <Input
                                            id="edit-task-due"
                                            type="date"
                                            value={dueDate}
                                            onChange={(event) =>
                                                setDueDate(event.target.value)
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-task-assignee">
                                        Assignee
                                    </Label>
                                    <Select
                                        value={assigneeId}
                                        onValueChange={setAssigneeId}
                                    >
                                        <SelectTrigger
                                            id="edit-task-assignee"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                Unassigned
                                            </SelectItem>
                                            {assignees.map((assignee) => (
                                                <SelectItem
                                                    key={assignee.id}
                                                    value={String(assignee.id)}
                                                >
                                                    {assignee.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditing(false)}
                                        disabled={isSaving}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving ? 'Saving…' : 'Save changes'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle className="pr-8 text-base leading-snug">
                                    {detail?.title ?? '…'}
                                </DialogTitle>
                            </DialogHeader>

                            {loading ? (
                                <p className="text-muted-foreground py-6 text-center text-sm">
                                    Loading task…
                                </p>
                            ) : loadError !== null ? (
                                <div className="space-y-3 py-4">
                                    <p className="text-destructive text-sm">
                                        {loadError}
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            task !== null && void load(task.id)
                                        }
                                    >
                                        Try again
                                    </Button>
                                </div>
                            ) : detail === null ? null : (
                                <>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className="bg-primary/10 text-primary gap-1 border-none px-1.5 py-0 font-normal"
                                        >
                                            <Flag
                                                className="size-3"
                                                aria-hidden="true"
                                            />
                                            {priorityLabel(detail.priority)}
                                        </Badge>

                                        {detail.due_date !== null &&
                                        due !== null &&
                                        due.tone !== 'neutral' ? (
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'gap-1 border-none px-1.5 py-0 font-normal',
                                                    due.tone === 'danger' &&
                                                        'bg-destructive/10 text-destructive',
                                                    due.tone === 'warning' &&
                                                        'bg-amber-500/15 text-amber-700 dark:text-amber-400',
                                                )}
                                            >
                                                <CalendarClock
                                                    className="size-3"
                                                    aria-hidden="true"
                                                />
                                                {due.label}
                                            </Badge>
                                        ) : null}

                                        {detail.is_completed ? (
                                            <Badge
                                                variant="outline"
                                                className="bg-primary/10 text-primary gap-1 border-none px-1.5 py-0 font-normal"
                                            >
                                                <Check
                                                    className="size-3"
                                                    aria-hidden="true"
                                                />
                                                Completed
                                            </Badge>
                                        ) : null}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                        {detail.assignee !== null ? (
                                            <span className="flex items-center gap-2">
                                                <Avatar className="size-6 rounded-full">
                                                    <AvatarFallback className="rounded-full text-[10px] font-medium">
                                                        {initials(
                                                            detail.assignee
                                                                .name,
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {detail.assignee.name}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                Unassigned
                                            </span>
                                        )}

                                        {detail.due_date !== null ? (
                                            <span className="text-muted-foreground">
                                                <CalendarClock
                                                    className="mr-1 inline size-3.5 align-[-2px]"
                                                    aria-hidden="true"
                                                />
                                                Due{' '}
                                                {formatDueDate(detail.due_date)}
                                            </span>
                                        ) : null}

                                        {detail.creator !== null ? (
                                            <span className="text-muted-foreground text-xs">
                                                Created by {detail.creator.name}{' '}
                                                ·{' '}
                                                {formatDateTime(
                                                    detail.created_at,
                                                )}
                                            </span>
                                        ) : null}
                                    </div>

                                    {detail.description !== null &&
                                    detail.description !== '' ? (
                                        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                                            {detail.description}
                                        </p>
                                    ) : null}

                                    {board.labels.length > 0 ? (
                                        <div className="space-y-2">
                                            <span className="text-sm font-medium">
                                                Labels
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {board.labels.map((label) => {
                                                    const checked =
                                                        detail.labels.some(
                                                            (item) =>
                                                                item.id ===
                                                                label.id,
                                                        );

                                                    return (
                                                        <button
                                                            key={label.id}
                                                            type="button"
                                                            disabled={
                                                                labelBusy !==
                                                                null
                                                            }
                                                            onClick={() =>
                                                                void toggleLabel(
                                                                    label.id,
                                                                )
                                                            }
                                                            className={cn(
                                                                'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60',
                                                                checked
                                                                    ? 'border-primary/60 bg-primary/10 text-foreground'
                                                                    : 'border-input bg-background text-muted-foreground hover:bg-accent',
                                                            )}
                                                        >
                                                            <span
                                                                className="size-2.5 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        label.color,
                                                                }}
                                                                aria-hidden="true"
                                                            />
                                                            {label.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : null}

                                    <Separator />

                                    <div className="space-y-2">
                                        <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                                            <History
                                                className="size-3.5"
                                                aria-hidden="true"
                                            />
                                            Activity
                                        </span>

                                        {detail.activities.length === 0 ? (
                                            <p className="text-muted-foreground text-sm">
                                                No activity yet.
                                            </p>
                                        ) : (
                                            <ul className="space-y-2">
                                                {[...detail.activities]
                                                    .reverse()
                                                    .map((activity) => (
                                                        <li
                                                            key={activity.id}
                                                            className="flex items-baseline justify-between gap-3 text-sm"
                                                        >
                                                            <span>
                                                                {activityLabel(
                                                                    activity,
                                                                )}
                                                            </span>
                                                            <span className="text-muted-foreground shrink-0 text-xs">
                                                                {formatDateTime(
                                                                    activity.created_at,
                                                                )}
                                                            </span>
                                                        </li>
                                                    ))}
                                            </ul>
                                        )}
                                    </div>

                                    <DialogFooter className="gap-2">
                                        <div className="flex w-full items-center justify-between gap-2 sm:justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    void handleToggleComplete()
                                                }
                                                disabled={
                                                    isToggling ||
                                                    labelBusy !== null
                                                }
                                            >
                                                {detail.is_completed
                                                    ? 'Reopen task'
                                                    : 'Mark complete'}
                                            </Button>

                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={startEditing}
                                                    disabled={
                                                        labelBusy !== null
                                                    }
                                                >
                                                    <Pencil
                                                        className="size-4"
                                                        aria-hidden="true"
                                                    />
                                                    Edit
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        setConfirmDelete(true)
                                                    }
                                                    disabled={
                                                        labelBusy !== null
                                                    }
                                                >
                                                    <Trash2
                                                        className="size-4"
                                                        aria-hidden="true"
                                                    />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogFooter>
                                </>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={confirmDelete}
                onOpenChange={setConfirmDelete}
                title="Delete task?"
                description={
                    detail === null
                        ? undefined
                        : `“${detail.title}” will be permanently removed. This can’t be undone.`
                }
                confirmLabel="Delete task"
                isLoading={deleting}
                onConfirm={() => void handleDelete()}
            />
        </>
    );
}
