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
import { updateProfile } from '@/spa/data/profile';
import {
    extractFieldErrors,
    getFieldError,
    toErrorMessage,
} from '@/spa/lib/errors';
import { useAuth } from '@/spa/store/auth';

export function ProfileForm(): React.JSX.Element {
    const { user, updateUser } = useAuth();

    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
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
            const updated = await updateProfile({ name, email });
            updateUser(updated);
            toast.success('Profile updated.');
        } catch (caught: unknown) {
            setFormError(toErrorMessage(caught));
            setFieldErrors(extractFieldErrors(caught));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                    Your name and email are shown to other workspace members.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={(event) => void handleSubmit(event)}
                    className="space-y-4"
                    noValidate
                >
                    {formError !== null ? (
                        <p className="text-destructive text-sm" role="alert">
                            {formError}
                        </p>
                    ) : null}

                    <div className="space-y-2">
                        <Label htmlFor="profile-name">Name</Label>
                        <Input
                            id="profile-name"
                            type="text"
                            autoComplete="name"
                            required
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            aria-invalid={
                                getFieldError(fieldErrors, 'name') !== undefined
                            }
                        />
                        {getFieldError(fieldErrors, 'name') !== undefined ? (
                            <p className="text-destructive text-sm">
                                {getFieldError(fieldErrors, 'name')}
                            </p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="profile-email">Email</Label>
                        <Input
                            id="profile-email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            aria-invalid={
                                getFieldError(fieldErrors, 'email') !==
                                undefined
                            }
                        />
                        {getFieldError(fieldErrors, 'email') !== undefined ? (
                            <p className="text-destructive text-sm">
                                {getFieldError(fieldErrors, 'email')}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving…' : 'Save changes'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
