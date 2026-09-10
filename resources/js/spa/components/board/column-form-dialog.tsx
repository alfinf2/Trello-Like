import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

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
import { createColumn, updateColumn } from '@/spa/data/columns';
import { getFieldError, toErrorMessage } from '@/spa/lib/errors';
import type { Column } from '@/spa/types';

export function fieldErrorsOf(caught: unknown): Record<string, string[]> {
    return caught instanceof Error && 'errors' in caught
        ? (caught.errors as Record<string, string[]>)
        : {};
}

export function ColumnFormDialog({
    open,
    onOpenChange,
    boardId,
    column,
    onSaved,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    boardId: number;
    column?: Column | null;
    onSaved: (column: Column) => void;
}): React.JSX.Element {
    const isEditing = column !== undefined && column !== null;

    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        setName(column?.name ?? '');
        setError(null);
        setFieldErrors({});
    }, [open, column]);

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        event.preventDefault();

        setError(null);
        setFieldErrors({});
        setIsSubmitting(true);

        try {
            const saved = isEditing
                ? await updateColumn(column.id, name)
                : await createColumn(boardId, name);

            toast.success(isEditing ? 'Column updated.' : 'Column added.');
            onSaved(saved);
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Rename column' : 'Add a column'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Change the heading for this column.'
                            : 'Columns group tasks into a stage of your workflow.'}
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
                        <Label htmlFor="column-name">Name</Label>
                        <Input
                            id="column-name"
                            type="text"
                            placeholder="In progress"
                            required
                            maxLength={191}
                            autoFocus
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            aria-invalid={fieldError('name') !== undefined}
                        />
                        {fieldError('name') !== undefined ? (
                            <p className="text-destructive text-sm">
                                {fieldError('name')}
                            </p>
                        ) : null}
                    </div>

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
                            {isSubmitting
                                ? 'Saving…'
                                : isEditing
                                  ? 'Save changes'
                                  : 'Add column'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
