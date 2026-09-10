import { api } from '@/spa/lib/api';
import type { BoardMember, DataEnvelope, MemberRole } from '@/spa/types';

export async function addMember(
    boardId: number,
    email: string,
    role: MemberRole = 'member',
): Promise<BoardMember> {
    const response = await api.post<DataEnvelope<BoardMember>>(
        `/boards/${boardId}/members`,
        {
            email,
            role,
        },
    );

    return response.data;
}

export async function removeMember(
    boardId: number,
    userId: number,
): Promise<void> {
    await api.delete(`/boards/${boardId}/members/${userId}`);
}
