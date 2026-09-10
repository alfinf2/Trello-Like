import { useEffect, useState, type FormEvent } from 'react';
import { ShieldCheck, ShieldOff } from 'lucide-react';
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
import { api } from '@/spa/lib/api';
import {
    extractFieldErrors,
    getFieldError,
    toErrorMessage,
} from '@/spa/lib/errors';
import type { DataEnvelope, MessageEnvelope } from '@/spa/types';

interface TwoFactorStatus {
    enabled: boolean;
    confirming: boolean;
}

interface TwoFactorSetup {
    setup_key: string;
    qr_svg: string;
    recovery_codes: string[];
}

export function TwoFactorSection(): React.JSX.Element | null {
    const [status, setStatus] = useState<TwoFactorStatus | null>(null);
    const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
    const [confirmCode, setConfirmCode] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>(
        {},
    );
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

    useEffect(() => {
        void api
            .get<DataEnvelope<TwoFactorStatus>>('/two-factor')
            .then(({ data }) => setStatus(data))
            .catch(() => {});
    }, []);

    const handleEnable = async (): Promise<void> => {
        setFormError(null);
        setFieldErrors({});
        setIsSubmitting(true);

        try {
            const { data } =
                await api.post<DataEnvelope<TwoFactorSetup>>('/two-factor');
            setSetup(data);
            toast.success('Scan the QR code and enter the 6-digit code.');
        } catch (caught: unknown) {
            setFormError(toErrorMessage(caught));
            setFieldErrors(extractFieldErrors(caught));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirm = async (
        event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        event.preventDefault();
        setFormError(null);
        setFieldErrors({});
        setIsSubmitting(true);

        try {
            await api.put<MessageEnvelope>('/two-factor', {
                code: confirmCode,
            });
            setStatus({ enabled: true, confirming: false });
            setSetup(null);
            setConfirmCode('');
            toast.success('Two-factor authentication enabled.');
        } catch (caught: unknown) {
            setFormError(toErrorMessage(caught));
            setFieldErrors(extractFieldErrors(caught));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDisable = async (): Promise<void> => {
        setFormError(null);
        setFieldErrors({});
        setIsSubmitting(true);

        try {
            await api.delete<MessageEnvelope>('/two-factor', { password });
            setStatus({ enabled: false, confirming: false });
            setPassword('');
            toast.success('Two-factor authentication disabled.');
        } catch (caught: unknown) {
            setFormError(toErrorMessage(caught));
            setFieldErrors(extractFieldErrors(caught));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === null) {
        return null;
    }

    if (setup !== null && status.enabled === false) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="size-4" aria-hidden="true" />
                        Set up two-factor authentication
                    </CardTitle>
                    <CardDescription>
                        Scan the QR code with your authenticator app, then enter
                        the 6-digit code.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {formError !== null ? (
                        <p className="text-destructive text-sm" role="alert">
                            {formError}
                        </p>
                    ) : null}

                    <div
                        className="flex justify-center"
                        dangerouslySetInnerHTML={{ __html: setup.qr_svg }}
                    />

                    <div className="text-center">
                        <p className="text-muted-foreground text-xs">
                            Manual entry key:{' '}
                            <code className="font-mono">{setup.setup_key}</code>
                        </p>
                    </div>

                    {showRecoveryCodes ? (
                        <div className="rounded-lg border p-3">
                            <p className="mb-2 text-sm font-medium">
                                Recovery codes (save these somewhere safe):
                            </p>
                            <div className="grid grid-cols-2 gap-1 font-mono text-xs">
                                {setup.recovery_codes.map((code) => (
                                    <div key={code}>{code}</div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowRecoveryCodes(true)}
                        >
                            Show recovery codes
                        </Button>
                    )}

                    <form
                        onSubmit={(event) => void handleConfirm(event)}
                        className="space-y-3"
                        noValidate
                    >
                        <div className="space-y-2">
                            <Label htmlFor="2fa-confirm-code">
                                6-digit code
                            </Label>
                            <Input
                                id="2fa-confirm-code"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                placeholder="000000"
                                required
                                value={confirmCode}
                                onChange={(event) =>
                                    setConfirmCode(event.target.value)
                                }
                                aria-invalid={
                                    getFieldError(fieldErrors, 'code') !==
                                    undefined
                                }
                            />
                            {getFieldError(fieldErrors, 'code') !==
                            undefined ? (
                                <p className="text-destructive text-sm">
                                    {getFieldError(fieldErrors, 'code')}
                                </p>
                            ) : null}
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? 'Confirming…'
                                    : 'Confirm & enable'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        );
    }

    if (status.enabled) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck
                            className="size-4 text-green-500"
                            aria-hidden="true"
                        />
                        Two-factor authentication is enabled
                    </CardTitle>
                    <CardDescription>
                        Your account is protected with an authenticator app.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {formError !== null ? (
                        <p className="text-destructive text-sm" role="alert">
                            {formError}
                        </p>
                    ) : null}

                    <div className="space-y-2">
                        <Label htmlFor="disable-password">
                            Current password
                        </Label>
                        <Input
                            id="disable-password"
                            type="password"
                            autoComplete="current-password"
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

                    <div className="flex justify-end">
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => void handleDisable()}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Disabling…' : 'Disable 2FA'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldOff className="size-4" aria-hidden="true" />
                    Two-factor authentication
                </CardTitle>
                <CardDescription>
                    Add an extra layer of security with an authenticator app.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {formError !== null ? (
                    <p className="text-destructive text-sm" role="alert">
                        {formError}
                    </p>
                ) : null}

                <div className="flex justify-end">
                    <Button
                        type="button"
                        onClick={() => void handleEnable()}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Setting up…' : 'Enable 2FA'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
