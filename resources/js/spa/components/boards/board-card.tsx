import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Globe,
    Lock,
    MoreHorizontal,
    Pencil,
    Trash2,
    Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/spa/components/ui/confirm-dialog';
import { deleteBoard } from '@/spa/data/boards';
import { toErrorMessage } from '@/spa/lib/errors';
import type { BoardSummary } from '@/spa/types';

export function BoardCard({
    board,
    onEdit,
    onDeleted,
}: {
    board: BoardSummary;
    onEdit: () => void;
    onDeleted: () => void;
}): React.JSX.Element {
    const navigate = useNavigate();

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const ownerInitial = (board.owner.name.at(0) ?? 'U').toUpperCase();

    const handleDelete = async (): Promise<void> => {
        setIsDeleting(true);

        try {
            await deleteBoard(board.id);
            toast.success('Board deleted.');
            setConfirmOpen(false);
            onDeleted();
        } catch (caught: unknown) {
            toast.error(toErrorMessage(caught));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div
                className="group bg-card hover:border-primary/40 focus-visible:ring-ring relative flex cursor-pointer flex-col rounded-xl border p-5 shadow-xs transition-all duration-200 outline-none hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2"
                role="link"
                tabIndex={0}
                onClick={() => void navigate(`/boards/${board.id}`)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        void navigate(`/boards/${board.id}`);
                    }
                }}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold tracking-tight">
                            {board.name}
                        </h3>

                        {board.description !== null &&
                        board.description !== '' ? (
                            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                                {board.description}
                            </p>
                        ) : (
                            <p className="text-muted-foreground/60 mt-1 text-sm">
                                No description
                            </p>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger
                            asChild
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                                aria-label="Board actions"
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onEdit();
                                }}
                            >
                                <Pencil className="size-4" aria-hidden="true" />
                                Edit details
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                variant="destructive"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setConfirmOpen(true);
                                }}
                            >
                                <Trash2 className="size-4" aria-hidden="true" />
                                Delete board
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="mt-5 flex items-center justify-between border-t pt-4">
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <Avatar className="size-5 rounded-full">
                            <AvatarFallback className="rounded-full text-[10px] font-medium">
                                {ownerInitial}
                            </AvatarFallback>
                        </Avatar>

                        <span className="max-w-24 truncate">
                            {board.owner.name}
                        </span>
                    </div>

                    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        <Badge
                            variant="secondary"
                            className="gap-1 px-1.5 py-0.5 font-normal"
                        >
                            {board.visibility === 'public' ? (
                                <Globe className="size-3" aria-hidden="true" />
                            ) : (
                                <Lock className="size-3" aria-hidden="true" />
                            )}
                            {board.visibility}
                        </Badge>

                        <span
                            className="inline-flex items-center gap-1"
                            title={`${board.member_count ?? 1} member(s)`}
                        >
                            <Users className="size-3.5" aria-hidden="true" />
                            {board.member_count ?? 1}
                        </span>
                    </div>
                </div>

                {board.task_count !== undefined ? (
                    <span className="text-muted-foreground pointer-events-none absolute top-5 right-14 text-xs font-medium tabular-nums">
                        {board.task_count} task
                        {board.task_count === 1 ? '' : 's'}
                    </span>
                ) : null}
            </div>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Delete board?"
                description={`"${board.name}" and everything inside it will be moved to trash. This cannot be undone.`}
                isLoading={isDeleting}
                onConfirm={() => void handleDelete()}
            />
        </>
    );
}
