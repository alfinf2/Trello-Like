import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import { App } from '@/spa/app';
import { AuthProvider } from '@/spa/store/auth';

initializeTheme();

const root = document.getElementById('root');

if (root === null) {
    throw new Error('SPA root element #root was not found.');
}

createRoot(root).render(
    <StrictMode>
        <BrowserRouter basename="/app">
            <TooltipProvider delayDuration={0}>
                <AuthProvider>
                    <App />
                    <Toaster />
                </AuthProvider>
            </TooltipProvider>
        </BrowserRouter>
    </StrictMode>,
);
