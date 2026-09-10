import { useState } from 'react';
import { KeyRound, Paintbrush, UserRound, type LucideIcon } from 'lucide-react';

import { AppearanceSection } from '@/spa/components/settings/appearance-section';
import { DangerZone } from '@/spa/components/settings/danger-zone';
import { ProfileForm } from '@/spa/components/settings/profile-form';
import { SecurityForm } from '@/spa/components/settings/security-form';
import { cn } from '@/lib/utils';

type Section = 'profile' | 'security' | 'appearance';

const sections: { id: Section; label: string; icon: LucideIcon }[] = [
    { id: 'profile', label: 'Profile', icon: UserRound },
    { id: 'security', label: 'Password & security', icon: KeyRound },
    { id: 'appearance', label: 'Appearance', icon: Paintbrush },
];

export function SettingsPage(): React.JSX.Element {
    const [active, setActive] = useState<Section>('profile');

    return (
        <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Settings
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Manage your account, security, and preferences.
                </p>
            </div>

            <div className="flex flex-col gap-8 sm:flex-row sm:gap-10">
                <nav
                    aria-label="Settings sections"
                    className="sm:w-52 sm:shrink-0"
                >
                    <div className="flex gap-1 overflow-x-auto sm:flex-col">
                        {sections.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setActive(id)}
                                aria-current={
                                    active === id ? 'page' : undefined
                                }
                                className={cn(
                                    'focus-visible:ring-ring flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px]',
                                    active === id
                                        ? 'bg-accent text-accent-foreground'
                                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                                )}
                            >
                                <Icon className="size-4" aria-hidden="true" />
                                {label}
                            </button>
                        ))}
                    </div>
                </nav>

                <div className="min-w-0 flex-1 space-y-6">
                    {active === 'profile' ? (
                        <>
                            <ProfileForm />
                            <DangerZone />
                        </>
                    ) : null}

                    {active === 'security' ? <SecurityForm /> : null}
                    {active === 'appearance' ? <AppearanceSection /> : null}
                </div>
            </div>
        </main>
    );
}
