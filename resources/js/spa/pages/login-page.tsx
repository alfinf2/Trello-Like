import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthError, AuthShell } from '@/spa/components/auth/auth-shell';
import { getFieldError, toErrorMessage } from '@/spa/lib/errors';
import { useAuth } from '@/spa/store/auth';

export function LoginPage(): React.JSX.Element {
    const { login, loginWithTwoFactor } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [twoFactorChallenge, setTwoFactorChallenge] = useState<string | null>(
        null,
    );
    const [twoFactorEmail, setTwoFactorEmail] = useState<string | null>(null);
    const [twoFactorCode, setTwoFactorCode] = useState('');

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        event.preventDefault();

        setError(null);
        setFieldErrors({});
        setIsSubmitting(true);

        try {
            const result = await login(email, password);

            if (result.two_factor) {
                setTwoFactorChallenge(result.challenge ?? null);
                setTwoFactorEmail(email);
                setTwoFactorCode('');
                setError(null);
                setFieldErrors({});
                return;
            }

            toast.success('Signed in.');
            void navigate('/', { replace: true });
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

    const handleTwoFactorSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        event.preventDefault();

        setError(null);
        setFieldErrors({});
        setIsSubmitting(true);

        try {
            await loginWithTwoFactor(twoFactorChallenge ?? '', twoFactorCode);
            toast.success('Signed in.');
            void navigate('/', { replace: true });
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

    if (twoFactorChallenge !== null) {
        return (
            <AuthShell
                title="Two-factor authentication"
                subtitle={`Enter the 6-digit code for ${twoFactorEmail}`}
                footer={
                    <button
                        type="button"
                        className="font-medium underline-offset-4 hover:underline"
                        onClick={() => {
                            setTwoFactorChallenge(null);
                            setTwoFactorEmail(null);
                            setTwoFactorCode('');
                            setError(null);
                            setFieldErrors({});
                        }}
                    >
                        Use a different account
                    </button>
                }
            >
                <form
                    onSubmit={(event) => void handleTwoFactorSubmit(event)}
                    className="space-y-4"
                    noValidate
                >
                    <AuthError message={error} />

                    <div className="space-y-2">
                        <Label htmlFor="two-factor-code">
                            Authentication code
                        </Label>
                        <Input
                            id="two-factor-code"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            placeholder="000000"
                            autoFocus
                            required
                            value={twoFactorCode}
                            onChange={(event) =>
                                setTwoFactorCode(event.target.value)
                            }
                            aria-invalid={
                                getFieldError(
                                    { errors: fieldErrors },
                                    'code',
                                ) !== undefined
                            }
                        />
                        {getFieldError({ errors: fieldErrors }, 'code') !==
                        undefined ? (
                            <p className="text-destructive text-sm">
                                {getFieldError({ errors: fieldErrors }, 'code')}
                            </p>
                        ) : null}
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Verifying…' : 'Verify'}
                    </Button>

                    <p className="text-muted-foreground text-center text-xs">
                        Lost access? Contact support for recovery codes.
                    </p>
                </form>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            title="Welcome back"
            subtitle="Sign in to your account to continue."
            footer={
                <Link
                    className="font-medium underline-offset-4 hover:underline"
                    to="/register"
                >
                    Don&apos;t have an account?
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
                            getFieldError({ errors: fieldErrors }, 'email') !==
                            undefined
                        }
                    />
                    {getFieldError({ errors: fieldErrors }, 'email') !==
                    undefined ? (
                        <p className="text-destructive text-sm">
                            {getFieldError({ errors: fieldErrors }, 'email')}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
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

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Signing in…' : 'Sign in'}
                </Button>

                <p className="text-muted-foreground pt-1 text-center text-xs">
                    <Link
                        className="font-medium underline-offset-4 hover:underline"
                        to="/forgot-password"
                    >
                        Forgot your password?
                    </Link>
                </p>

                <p className="text-muted-foreground pt-1 text-center text-xs">
                    Demo account:{' '}
                    <span className="text-foreground font-medium">
                        test@example.com
                    </span>{' '}
                    /{' '}
                    <span className="text-foreground font-medium">
                        password
                    </span>
                </p>
            </form>
        </AuthShell>
    );
}
