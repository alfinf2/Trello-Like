import { api } from '@/spa/lib/api';
import type { DataEnvelope, Label, MessageEnvelope } from '@/spa/types';

export async function createLabel(
    boardId: number,
    input: { name: string; color: string },
): Promise<Label> {
    const response = await api.post<DataEnvelope<Label>>(
        `/boards/${boardId}/labels`,
        input,
    );

    return response.data;
}

export async function deleteLabel(labelId: number): Promise<void> {
    await api.delete(`/labels/${labelId}`);
}

export async function attachLabels(
    taskId: number,
    labelIds: number[],
): Promise<Label[]> {
    const response = await api.post<{ data: Label[] }>(
        `/tasks/${taskId}/labels`,
        {
            label_ids: labelIds,
        },
    );

    return response.data;
}

export async function detachLabel(
    taskId: number,
    labelId: number,
): Promise<void> {
    await api.delete<MessageEnvelope>(`/tasks/${taskId}/labels/${labelId}`);
}
