import { Monitor, Moon, Sun } from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useAppearance } from '@/hooks/use-appearance';
import type { Appearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

const options: {
    value: Appearance;
    label: string;
    description: string;
    icon: typeof Sun;
}[] = [
    {
        value: 'light',
        label: 'Light',
        description: 'Always use the light theme.',
        icon: Sun,
    },
    {
        value: 'dark',
        label: 'Dark',
        description: 'Always use the dark theme.',
        icon: Moon,
    },
    {
        value: 'system',
        label: 'System',
        description: 'Follow your device setting.',
        icon: Monitor,
    },
];

export function AppearanceSection(): React.JSX.Element {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                    Control how the app looks across your devices.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-2 sm:grid-cols-3">
                    {options.map(
                        ({ value, label, description, icon: Icon }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => updateAppearance(value)}
                                aria-pressed={appearance === value}
                                className={cn(
                                    'focus-visible:ring-ring rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-[3px]',
                                    appearance === value
                                        ? 'bg-accent text-accent-foreground border-primary/60'
                                        : 'hover:bg-accent/50',
                                )}
                            >
                                <Icon className="size-4" aria-hidden="true" />
                                <span className="mt-2 block text-sm font-medium">
                                    {label}
                                </span>
                                <span className="text-muted-foreground mt-0.5 block text-xs">
                                    {description}
                                </span>
                            </button>
                        ),
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
