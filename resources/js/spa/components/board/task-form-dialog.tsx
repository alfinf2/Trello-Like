import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { fieldErrorsOf } from '@/spa/components/board/column-form-dialog';
import { createTask } from '@/spa/data/tasks';
import { getFieldError, toErrorMessage } from '@/spa/lib/errors';
import { PRIORITY_OPTIONS } from '@/spa/lib/format';
import type {
    BoardDetail,
    ColumnWithTasks,
    Task,
    TaskPriority,
} from '@/spa/types';

const TEXTAREA_CLASS =
    'border-input placeholder:text-muted-foreground min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]';

export function getAssignees(
    board: BoardDetail,
): Array<{ id: number; name: string; email: string }> {
    const merged = new Map<
        number,
        { id: number; name: string; email: string }
    >();

    for (const member of board.members) {
        merged.set(member.id, member);
    }

    merged.set(board.owner.id, board.owner);

    return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function TaskFormDialog({
    open,
    onOpenChange,
    board,
    column,
    onSaved,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    board: BoardDetail;
    column: ColumnWithTasks;
    onSaved: (task: Task) => void;
}): React.JSX.Element {
    const assignees = useMemo(() => getAssignees(board), [board]);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [dueDate, setDueDate] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [labelIds, setLabelIds] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        setAssigneeId('');
        setLabelIds([]);
        setError(null);
        setFieldErrors({});
    }, [open, column.id]);

    const toggleLabel = (labelId: number): void => {
        setLabelIds((current) =>
            current.includes(labelId)
                ? current.filter((id) => id !== labelId)
                : [...current, labelId],
        );
    };

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        event.preventDefault();

        setError(null);
        setFieldErrors({});
        setIsSubmitting(true);

        try {
            const created = await createTask({
                column_id: column.id,
                title,
                description: description === '' ? null : description,
                priority,
                due_date: dueDate === '' ? null : dueDate,
                assignee_id: assigneeId === '' ? null : Number(assigneeId),
                labels: labelIds,
            });

            toast.success('Task created.');
            onSaved(created);
            onOpenChange(false);
        } catch (caught: unknown) {
            setError(toErrorMessage(caught));
            setFieldErrors(fieldErrorsOf(caught));
        } finally {
            setIsSubmitting(false);
        }
    };

    const fieldError = (field: string): string | undefined =>
        getFieldError({ errors: fieldErrors }, field);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add a task</DialogTitle>
                    <DialogDescription>
                        Create a task in “{column.name}”.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(event) => void handleSubmit(event)}
                    className="space-y-4"
                    noValidate
                >
                    {error !== null ? (
                        <div
                            role="alert"
                            className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
                        >
                            {error}
                        </div>
                    ) : null}

                    <div className="space-y-2">
                        <Label htmlFor="task-title">Title</Label>
                        <Input
                            id="task-title"
                            type="text"
                            placeholder="Ship the onboarding flow"
                            required
                            maxLength={191}
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            aria-invalid={fieldError('title') !== undefined}
                        />
                        {fieldError('title') !== undefined ? (
                            <p className="text-destructive text-sm">
                                {fieldError('title')}
                            </p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="task-description">Description</Label>
                        <textarea
                            id="task-description"
                            placeholder="Optional details…"
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
                            <Label htmlFor="task-priority">Priority</Label>
                            <Select
                                value={priority}
                                onValueChange={(value) =>
                                    setPriority(value as TaskPriority)
                                }
                            >
                                <SelectTrigger
                                    id="task-priority"
                                    className="w-full"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRIORITY_OPTIONS.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {fieldError('priority') !== undefined ? (
                                <p className="text-destructive text-sm">
                                    {fieldError('priority')}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="task-due">Due date</Label>
                            <Input
                                id="task-due"
                                type="date"
                                value={dueDate}
                                onChange={(event) =>
                                    setDueDate(event.target.value)
                                }
                                aria-invalid={
                                    fieldError('due_date') !== undefined
                                }
                            />
                            {fieldError('due_date') !== undefined ? (
                                <p className="text-destructive text-sm">
                                    {fieldError('due_date')}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="task-assignee">Assignee</Label>
                        <Select
                            value={assigneeId}
                            onValueChange={setAssigneeId}
                        >
                            <SelectTrigger
                                id="task-assignee"
                                className="w-full"
                            >
                                <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Unassigned</SelectItem>
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

                    {board.labels.length > 0 ? (
                        <div className="space-y-2">
                            <span className="text-sm font-medium">Labels</span>
                            <div className="flex flex-wrap gap-2">
                                {board.labels.map((label) => {
                                    const checked = labelIds.includes(label.id);

                                    return (
                                        <label
                                            key={label.id}
                                            className="has-data-[state=checked]:border-primary/60 has-data-[state=checked]:bg-primary/5 flex cursor-pointer items-center gap-2 rounded-full border px-2.5 py-1 text-sm transition-colors"
                                        >
                                            <Checkbox
                                                checked={checked}
                                                onCheckedChange={() =>
                                                    toggleLabel(label.id)
                                                }
                                            />
                                            <span
                                                className="size-2.5 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        label.color,
                                                }}
                                                aria-hidden="true"
                                            />
                                            <span className="text-xs font-medium">
                                                {label.name}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating…' : 'Create task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
