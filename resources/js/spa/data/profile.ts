import { api } from '@/spa/lib/api';
import type { DataEnvelope, MessageEnvelope, User } from '@/spa/types';

export interface UpdateProfileInput {
    name?: string;
    email?: string;
}

export async function updateProfile(input: UpdateProfileInput): Promise<User> {
    const { data } = await api.put<DataEnvelope<User>>('/profile', input);

    return data;
}

export interface UpdatePasswordInput {
    current_password: string;
    password: string;
    password_confirmation: string;
}

export async function updatePassword(
    input: UpdatePasswordInput,
): Promise<MessageEnvelope> {
    return api.put<MessageEnvelope>('/profile/password', input);
}

export async function deleteAccount(
    password: string,
): Promise<MessageEnvelope> {
    return api.delete<MessageEnvelope>('/profile', { password });
}
