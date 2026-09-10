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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createBoard, updateBoard } from '@/spa/data/boards';
import { getFieldError, toErrorMessage } from '@/spa/lib/errors';
import type { BoardSummary, BoardVisibility } from '@/spa/types';

export function BoardFormDialog({
    open,
    onOpenChange,
    board,
    onSaved,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    board?: BoardSummary | null;
    onSaved: (board: BoardSummary) => void;
}): React.JSX.Element {
    const isEditing = board !== undefined && board !== null;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [visibility, setVisibility] = useState<BoardVisibility>('private');
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        setName(board?.name ?? '');
        setDescription(board?.description ?? '');
        setVisibility(board?.visibility ?? 'private');
        setError(null);
        setFieldErrors({});
    }, [open, board]);

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        event.preventDefault();

        setError(null);
        setFieldErrors({});
        setIsSubmitting(true);

        try {
            const saved = isEditing
                ? await updateBoard(board.id, {
                      name,
                      description: description || null,
                      visibility,
                  })
                : await createBoard({
                      name,
                      description: description || null,
                      visibility,
                  });

            toast.success(isEditing ? 'Board updated.' : 'Board created.');
            onSaved(saved);
            onOpenChange(false);
        } catch (caught: unknown) {
            setError(toErrorMessage(caught));
            setFieldErrors(
                caught instanceof Error &&
                    'errors' in caught &&
                    caught.errors !== undefined
                    ? (caught.errors as Record<string, string[]>)
                    : {},
            );
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
                        {isEditing ? 'Edit board' : 'Create a board'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the details of your board.'
                            : 'Boards group columns and tasks around a single goal or project.'}
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
                        <Label htmlFor="board-name">Name</Label>
                        <Input
                            id="board-name"
                            type="text"
                            placeholder="Product launch"
                            required
                            maxLength={191}
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

                    <div className="space-y-2">
                        <Label htmlFor="board-description">Description</Label>
                        <Input
                            id="board-description"
                            type="text"
                            placeholder="Optional short description"
                            maxLength={5000}
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            aria-invalid={
                                fieldError('description') !== undefined
                            }
                        />
                        {fieldError('description') !== undefined ? (
                            <p className="text-destructive text-sm">
                                {fieldError('description')}
                            </p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="board-visibility">Visibility</Label>
                        <Select
                            value={visibility}
                            onValueChange={(value) =>
                                setVisibility(value as BoardVisibility)
                            }
                        >
                            <SelectTrigger
                                id="board-visibility"
                                className="w-full"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="private">
                                    Private — only members
                                </SelectItem>
                                <SelectItem value="public">
                                    Public — anyone can view
                                </SelectItem>
                            </SelectContent>
                        </Select>
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
                                ? isEditing
                                    ? 'Saving…'
                                    : 'Creating…'
                                : isEditing
                                  ? 'Save changes'
                                  : 'Create board'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
