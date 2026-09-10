import { api } from '@/spa/lib/api';
import type { DataEnvelope, Task, TaskDetail, TaskPriority } from '@/spa/types';

export interface CreateTaskInput {
    column_id: number;
    title: string;
    description?: string | null;
    assignee_id?: number | null;
    priority?: TaskPriority;
    due_date?: string | null;
    labels?: number[];
}

export interface UpdateTaskInput {
    title?: string;
    description?: string | null;
    assignee_id?: number | null;
    priority?: TaskPriority;
    due_date?: string | null;
    is_completed?: boolean;
}

export async function fetchTask(id: number): Promise<TaskDetail> {
    const response = await api.get<DataEnvelope<TaskDetail>>(`/tasks/${id}`);

    return response.data;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
    const response = await api.post<DataEnvelope<Task>>('/tasks', input);

    return response.data;
}

export async function updateTask(
    id: number,
    input: UpdateTaskInput,
): Promise<Task> {
    const response = await api.put<DataEnvelope<Task>>(`/tasks/${id}`, input);

    return response.data;
}

export async function moveTask(
    id: number,
    columnId: number,
    position: number,
): Promise<Task> {
    const response = await api.put<DataEnvelope<Task>>(`/tasks/${id}/move`, {
        column_id: columnId,
        position,
    });

    return response.data;
}

export async function deleteTask(id: number): Promise<void> {
    await api.delete(`/tasks/${id}`);
}
