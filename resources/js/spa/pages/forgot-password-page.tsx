import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthError, AuthShell } from '@/spa/components/auth/auth-shell';
import { api } from '@/spa/lib/api';
import { getFieldError, toErrorMessage } from '@/spa/lib/errors';
import type { MessageEnvelope } from '@/spa/types';

export function ForgotPasswordPage(): React.JSX.Element {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        event.preventDefault();
        setError(null);
        setFieldErrors({});
        setIsSubmitting(true);

        try {
            await api.post<MessageEnvelope>('/forgot-password', { email });
            setSent(true);
            toast.success('Reset link sent. Check your email.');
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

    return (
        <AuthShell
            title="Reset your password"
            subtitle="Enter your email and we'll send you a reset link."
            footer={
                <Link
                    className="font-medium underline-offset-4 hover:underline"
                    to="/login"
                >
                    Back to sign in
                </Link>
            }
        >
            {sent ? (
                <div className="space-y-4 text-center">
                    <p className="text-muted-foreground text-sm">
                        If an account exists with that email, you'll receive a
                        password reset link shortly.
                    </p>
                    <Link
                        to="/login"
                        className="text-muted-foreground text-sm font-medium underline-offset-4 hover:underline"
                    >
                        Return to sign in
                    </Link>
                </div>
            ) : (
                <form
                    onSubmit={(event) => void handleSubmit(event)}
                    className="space-y-4"
                    noValidate
                >
                    <AuthError message={error} />

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            aria-invalid={
                                getFieldError(
                                    { errors: fieldErrors },
                                    'email',
                                ) !== undefined
                            }
                        />
                        {getFieldError({ errors: fieldErrors }, 'email') !==
                        undefined ? (
                            <p className="text-destructive text-sm">
                                {getFieldError(
                                    { errors: fieldErrors },
                                    'email',
                                )}
                            </p>
                        ) : null}
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Sending…' : 'Send reset link'}
                    </Button>
                </form>
            )}
        </AuthShell>
    );
}
