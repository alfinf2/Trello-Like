import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthError, AuthShell } from '@/spa/components/auth/auth-shell';
import { api } from '@/spa/lib/api';
import { getFieldError, toErrorMessage } from '@/spa/lib/errors';
import type { MessageEnvelope } from '@/spa/types';

export function ResetPasswordPage(): React.JSX.Element {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');

    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (token === null || emailParam === null) {
        return (
            <AuthShell
                title="Invalid reset link"
                subtitle="The password reset link is invalid or has expired."
                footer={
                    <Link
                        className="font-medium underline-offset-4 hover:underline"
                        to="/forgot-password"
                    >
                        Request a new link
                    </Link>
                }
            >
                <p className="text-muted-foreground text-center text-sm">
                    Please request a new password reset link.
                </p>
            </AuthShell>
        );
    }

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        event.preventDefault();
        setError(null);
        setFieldErrors({});
        setIsSubmitting(true);

        try {
            await api.post<MessageEnvelope>('/reset-password', {
                token,
                email: emailParam,
                password,
                password_confirmation: passwordConfirmation,
            });
            toast.success('Password reset. Sign in with your new password.');
            void navigate('/login', { replace: true });
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
            title="Set new password"
            subtitle="Choose a strong password for your account."
            footer={
                <Link
                    className="font-medium underline-offset-4 hover:underline"
                    to="/login"
                >
                    Back to sign in
                </Link>
            }
        >
            <form
                onSubmit={(event) => void handleSubmit(event)}
                className="space-y-4"
                noValidate
            >
                <AuthError message={error} />

                <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            placeholder="••••••••"
                            required
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            aria-invalid={
                                getFieldError(
                                    { errors: fieldErrors },
                                    'password',
                                ) !== undefined
                            }
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowPassword((current) => !current)
                            }
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                            aria-label={
                                showPassword ? 'Hide password' : 'Show password'
                            }
                        >
                            {showPassword ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                        </button>
                    </div>
                    {getFieldError({ errors: fieldErrors }, 'password') !==
                    undefined ? (
                        <p className="text-destructive text-sm">
                            {getFieldError({ errors: fieldErrors }, 'password')}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password-confirmation">
                        Confirm password
                    </Label>
                    <Input
                        id="password-confirmation"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        required
                        value={passwordConfirmation}
                        onChange={(event) =>
                            setPasswordConfirmation(event.target.value)
                        }
                        aria-invalid={
                            getFieldError(
                                { errors: fieldErrors },
                                'password',
                            ) !== undefined
                        }
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Resetting…' : 'Reset password'}
                </Button>
            </form>
        </AuthShell>
    );
}
