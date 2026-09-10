import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';

import {
    ApiError,
    api,
    getToken,
    setToken,
    setUnauthorizedHandler,
} from '@/spa/lib/api';
import type { DataEnvelope, User } from '@/spa/types';

type AuthStatus = 'loading' | 'authenticated' | 'guest';

interface AuthPayload {
    user: User;
    token: string;
}

interface TwoFactorLoginResponse {
    two_factor?: boolean;
    challenge?: string;
}

interface AuthContextValue {
    status: AuthStatus;
    user: User | null;
    login: (email: string, password: string) => Promise<TwoFactorLoginResponse>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    clearSession: () => void;
    updateUser: (user: User) => void;
    loginWithTwoFactor: (challenge: string, code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
    children,
}: {
    children: ReactNode;
}): React.JSX.Element {
    const [status, setStatus] = useState<AuthStatus>('loading');
    const [user, setUser] = useState<User | null>(null);
    const hasBootstrapped = useRef(false);

    const clearSession = useCallback((): void => {
        setToken(null);
        setUser(null);
        setStatus('guest');
    }, []);

    useEffect(() => {
        if (hasBootstrapped.current) {
            return;
        }

        hasBootstrapped.current = true;

        setUnauthorizedHandler(() => {
            clearSession();
        });

        if (getToken() === null) {
            setStatus('guest');

            return;
        }

        api.get<DataEnvelope<User>>('/me')
            .then(({ data }) => {
                setUser(data);
                setStatus('authenticated');
            })
            .catch((error: unknown) => {
                if (error instanceof ApiError && error.status !== 401) {
                    setStatus('guest');
                }
            });
    }, [clearSession]);

    const login = useCallback(
        async (
            email: string,
            password: string,
        ): Promise<TwoFactorLoginResponse> => {
            const { data } = await api.post<
                DataEnvelope<AuthPayload & TwoFactorLoginResponse>
            >('/login', {
                email,
                password,
                device_name: 'web',
            });

            if (data.two_factor) {
                return { two_factor: true, challenge: data.challenge };
            }

            setToken(data.token);
            setUser(data.user);
            setStatus('authenticated');
            return {};
        },
        [],
    );

    const loginWithTwoFactor = useCallback(
        async (challenge: string, code: string): Promise<void> => {
            const { data } = await api.post<DataEnvelope<AuthPayload>>(
                '/two-factor/login',
                { challenge, code },
            );

            setToken(data.token);
            setUser(data.user);
            setStatus('authenticated');
        },
        [],
    );

    const register = useCallback(
        async (
            name: string,
            email: string,
            password: string,
        ): Promise<void> => {
            const { data } = await api.post<DataEnvelope<AuthPayload>>(
                '/register',
                {
                    name,
                    email,
                    password,
                    password_confirmation: password,
                    device_name: 'web',
                },
            );

            setToken(data.token);
            setUser(data.user);
            setStatus('authenticated');
        },
        [],
    );

    const logout = useCallback(async (): Promise<void> => {
        try {
            await api.post('/logout');
        } finally {
            clearSession();
        }
    }, [clearSession]);

    const updateUser = useCallback((nextUser: User): void => {
        setUser(nextUser);
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            status,
            user,
            login,
            register,
            logout,
            clearSession,
            updateUser,
            loginWithTwoFactor,
        }),
        [
            status,
            user,
            login,
            register,
            logout,
            clearSession,
            updateUser,
            loginWithTwoFactor,
        ],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider.');
    }

    return context;
}
