import { api } from '@/spa/lib/api';
import type {
    BoardDetail,
    BoardSummary,
    BoardVisibility,
    DataEnvelope,
    Paginated,
} from '@/spa/types';

export interface BoardInput {
    name: string;
    description?: string | null;
    visibility?: BoardVisibility;
}

export async function fetchBoards(): Promise<BoardSummary[]> {
    const response = await api.get<Paginated<BoardSummary>>(
        '/boards?per_page=100',
    );

    return response.data;
}

export async function fetchBoard(id: number): Promise<BoardDetail> {
    const response = await api.get<DataEnvelope<BoardDetail>>(`/boards/${id}`);

    return response.data;
}

export async function createBoard(input: BoardInput): Promise<BoardSummary> {
    const response = await api.post<DataEnvelope<BoardSummary>>(
        '/boards',
        input,
    );

    return response.data;
}

export async function updateBoard(
    id: number,
    input: Partial<BoardInput>,
): Promise<BoardSummary> {
    const response = await api.put<DataEnvelope<BoardSummary>>(
        `/boards/${id}`,
        input,
    );

    return response.data;
}

export async function deleteBoard(id: number): Promise<void> {
    await api.delete(`/boards/${id}`);
}
