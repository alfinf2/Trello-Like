import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updatePassword } from '@/spa/data/profile';
import {
    extractFieldErrors,
    getFieldError,
    toErrorMessage,
} from '@/spa/lib/errors';
import { TwoFactorSection } from '@/spa/components/settings/two-factor-section';

export function SecurityForm(): React.JSX.Element {
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        event.preventDefault();

        setFormError(null);
        setFieldErrors({});
        setIsSubmitting(true);

        try {
            await updatePassword({
                current_password: currentPassword,
                password,
                password_confirmation: passwordConfirmation,
            });
            setCurrentPassword('');
            setPassword('');
            setPasswordConfirmation('');
            toast.success('Password updated.');
        } catch (caught: unknown) {
            setFormError(toErrorMessage(caught));
            setFieldErrors(extractFieldErrors(caught));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Password</CardTitle>
                    <CardDescription>
                        Choose a strong password. Changing it signs out your
                        other devices.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={(event) => void handleSubmit(event)}
                        className="space-y-4"
                        noValidate
                    >
                        {formError !== null ? (
                            <p
                                className="text-destructive text-sm"
                                role="alert"
                            >
                                {formError}
                            </p>
                        ) : null}

                        <div className="space-y-2">
                            <Label htmlFor="current-password">
                                Current password
                            </Label>
                            <Input
                                id="current-password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={currentPassword}
                                onChange={(event) =>
                                    setCurrentPassword(event.target.value)
                                }
                                aria-invalid={
                                    getFieldError(
                                        fieldErrors,
                                        'current_password',
                                    ) !== undefined
                                }
                            />
                            {getFieldError(fieldErrors, 'current_password') !==
                            undefined ? (
                                <p className="text-destructive text-sm">
                                    {getFieldError(
                                        fieldErrors,
                                        'current_password',
                                    )}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-password">New password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                aria-invalid={
                                    getFieldError(fieldErrors, 'password') !==
                                    undefined
                                }
                            />
                            {getFieldError(fieldErrors, 'password') !==
                            undefined ? (
                                <p className="text-destructive text-sm">
                                    {getFieldError(fieldErrors, 'password')}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-password-confirmation">
                                Confirm new password
                            </Label>
                            <Input
                                id="new-password-confirmation"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={passwordConfirmation}
                                onChange={(event) =>
                                    setPasswordConfirmation(event.target.value)
                                }
                                aria-invalid={
                                    getFieldError(fieldErrors, 'password') !==
                                    undefined
                                }
                            />
                            {getFieldError(fieldErrors, 'password') !==
                            undefined ? (
                                <p className="text-destructive text-sm">
                                    {getFieldError(fieldErrors, 'password')}
                                </p>
                            ) : null}
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Updating…' : 'Update password'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <TwoFactorSection />
        </>
    );
}
