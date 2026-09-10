import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteAccount } from '@/spa/data/profile';
import {
    extractFieldErrors,
    getFieldError,
    toErrorMessage,
} from '@/spa/lib/errors';
import { useAuth } from '@/spa/store/auth';

export function DangerZone(): React.JSX.Element {
    const { clearSession } = useAuth();
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDelete = async (
        event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        event.preventDefault();

        setFormError(null);
        setFieldErrors({});
        setIsSubmitting(true);

        try {
            await deleteAccount(password);
            clearSession();
            toast.success('Your account has been deleted.');
            void navigate('/login', { replace: true });
        } catch (caught: unknown) {
            setFormError(toErrorMessage(caught));
            setFieldErrors(extractFieldErrors(caught));
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                    <Trash2 className="size-4" aria-hidden="true" />
                    Danger zone
                </CardTitle>
                <CardDescription>
                    Deleting your account permanently removes your boards,
                    tasks, and activity. This cannot be undone.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="destructive">Delete account</Button>
                    </DialogTrigger>

                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete your account?</DialogTitle>
                            <DialogDescription>
                                This will permanently delete your account and
                                everything associated with it. Enter your
                                password to confirm.
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={(event) => void handleDelete(event)}
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
                                <Label htmlFor="delete-password">
                                    Password
                                </Label>
                                <Input
                                    id="delete-password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    aria-invalid={
                                        getFieldError(
                                            fieldErrors,
                                            'password',
                                        ) !== undefined
                                    }
                                />
                                {getFieldError(fieldErrors, 'password') !==
                                undefined ? (
                                    <p className="text-destructive text-sm">
                                        {getFieldError(fieldErrors, 'password')}
                                    </p>
                                ) : null}
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? 'Deleting…'
                                        : 'Delete account'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
