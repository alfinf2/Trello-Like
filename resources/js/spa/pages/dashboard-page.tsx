import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, FolderKanban, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { BoardCard } from '@/spa/components/boards/board-card';
import { BoardFormDialog } from '@/spa/components/boards/board-form-dialog';
import {
    EmptyState,
    ErrorState,
    LoadingBlock,
} from '@/spa/components/ui/status';
import { fetchBoards } from '@/spa/data/boards';
import { api } from '@/spa/lib/api';
import { toErrorMessage } from '@/spa/lib/errors';
import { useAuth } from '@/spa/store/auth';
import type { BoardSummary, MessageEnvelope } from '@/spa/types';

export function DashboardPage(): React.JSX.Element {
    const { user } = useAuth();
    const [boards, setBoards] = useState<BoardSummary[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<BoardSummary | null>(null);
    const [verificationSent, setVerificationSent] = useState(false);
    const [sendingVerification, setSendingVerification] = useState(false);

    const handleResendVerification = async (): Promise<void> => {
        setSendingVerification(true);
        try {
            await api.post<MessageEnvelope>('/email/verification-notification');
            setVerificationSent(true);
            toast.success('Verification link sent.');
        } catch {
            toast.error('Failed to send verification email.');
        } finally {
            setSendingVerification(false);
        }
    };

    const load = useCallback(async (): Promise<void> => {
        setError(null);
        setBoards(null);

        try {
            setBoards(await fetchBoards());
        } catch (caught: unknown) {
            setError(toErrorMessage(caught));
            setBoards([]);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const handleSaved = (board: BoardSummary): void => {
        setBoards((current) => {
            if (current === null) {
                return [board];
            }

            const exists = current.some((item) => item.id === board.id);

            return exists
                ? current.map((item) =>
                      item.id === board.id ? { ...item, ...board } : item,
                  )
                : [board, ...current];
        });
    };

    return (
        <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Your boards
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Jump into a board to track your work.
                    </p>
                </div>

                <Button
                    className="mt-4 sm:mt-0"
                    onClick={() => {
                        setEditing(null);
                        setFormOpen(true);
                    }}
                >
                    <Plus className="size-4" aria-hidden="true" />
                    New board
                </Button>
            </div>

            {user?.email_verified_at === null ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/50 dark:bg-amber-950/30">
                    <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="text-amber-800 dark:text-amber-200">
                            Your email is not verified.
                        </span>
                        {verificationSent ? (
                            <span className="text-amber-600 dark:text-amber-400">
                                Verification link sent.
                            </span>
                        ) : (
                            <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-amber-700 underline dark:text-amber-300"
                                onClick={() => void handleResendVerification()}
                                disabled={sendingVerification}
                            >
                                {sendingVerification
                                    ? 'Sending…'
                                    : 'Resend verification email'}
                            </Button>
                        )}
                    </div>
                </div>
            ) : null}

            <div className="mt-8">
                {boards === null && error === null ? (
                    <LoadingBlock
                        count={6}
                        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    />
                ) : null}

                {error !== null ? (
                    <ErrorState
                        title="Could not load boards"
                        description={error}
                        onRetry={() => void load()}
                    />
                ) : null}

                {boards !== null && error === null && boards.length === 0 ? (
                    <EmptyState
                        icon={FolderKanban}
                        title="No boards yet"
                        description="Create a board to start organizing columns and tasks."
                        action={
                            <Button
                                onClick={() => {
                                    setEditing(null);
                                    setFormOpen(true);
                                }}
                            >
                                <Plus className="size-4" aria-hidden="true" />
                                Create your first board
                            </Button>
                        }
                    />
                ) : null}

                {boards !== null && error === null && boards.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {boards.map((board) => (
                            <BoardCard
                                key={board.id}
                                board={board}
                                onEdit={() => {
                                    setEditing(board);
                                    setFormOpen(true);
                                }}
                                onDeleted={() => load()}
                            />
                        ))}
                    </div>
                ) : null}
            </div>

            <BoardFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                board={editing}
                onSaved={handleSaved}
            />
        </main>
    );
}
