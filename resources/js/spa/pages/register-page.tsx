import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthError, AuthShell } from '@/spa/components/auth/auth-shell';
import { getFieldError, toErrorMessage } from '@/spa/lib/errors';
import { useAuth } from '@/spa/store/auth';

export function RegisterPage(): React.JSX.Element {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        event.preventDefault();

        setError(null);
        setFieldErrors({});
        setIsSubmitting(true);

        try {
            await register(name, email, password);
            toast.success('Account created. Welcome!');
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

    const fieldError = (field: string): string | undefined =>
        getFieldError({ errors: fieldErrors }, field);

    return (
        <AuthShell
            title="Create your account"
            subtitle="Set up a profile to start tracking tasks."
            footer={
                <Link
                    className="font-medium underline-offset-4 hover:underline"
                    to="/login"
                >
                    Already have an account?
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
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Ada Lovelace"
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
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        required
                        maxLength={191}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        aria-invalid={fieldError('email') !== undefined}
                    />
                    {fieldError('email') !== undefined ? (
                        <p className="text-destructive text-sm">
                            {fieldError('email')}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        aria-invalid={fieldError('password') !== undefined}
                    />
                    {fieldError('password') !== undefined ? (
                        <p className="text-destructive text-sm">
                            {fieldError('password')}
                        </p>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password_confirmation">
                        Confirm password
                    </Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Repeat your password"
                        required
                        value={passwordConfirmation}
                        onChange={(event) =>
                            setPasswordConfirmation(event.target.value)
                        }
                        aria-invalid={fieldError('password') !== undefined}
                    />
                    {fieldError('password') !== undefined ? (
                        <p className="text-destructive text-sm">
                            {fieldError('password')}
                        </p>
                    ) : null}
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Creating account…' : 'Create account'}
                </Button>
            </form>
        </AuthShell>
    );
}
