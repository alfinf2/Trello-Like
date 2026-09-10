import { api } from '@/spa/lib/api';
import type { Column, DataEnvelope, MessageEnvelope } from '@/spa/types';

export async function createColumn(
    boardId: number,
    name: string,
): Promise<Column> {
    const response = await api.post<DataEnvelope<Column>>(
        `/boards/${boardId}/columns`,
        { name },
    );

    return response.data;
}

export async function updateColumn(
    columnId: number,
    name: string,
): Promise<Column> {
    const response = await api.put<DataEnvelope<Column>>(
        `/columns/${columnId}`,
        { name },
    );

    return response.data;
}

export async function deleteColumn(columnId: number): Promise<void> {
    await api.delete(`/columns/${columnId}`);
}

export async function reorderColumns(
    boardId: number,
    columns: Array<{ id: number; position: number }>,
): Promise<void> {
    await api.put<MessageEnvelope>(`/boards/${boardId}/columns/reorder`, {
        columns,
    });
}
