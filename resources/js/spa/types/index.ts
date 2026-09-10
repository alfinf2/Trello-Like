export type BoardVisibility = 'private' | 'public';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type MemberRole = 'admin' | 'member';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string | null;
}

export interface BoardMember extends User {
    role: MemberRole;
    joined_at: string | null;
}

export interface Label {
    id: number;
    board_id: number;
    name: string;
    color: string;
    created_at: string | null;
    updated_at: string | null;
}

export interface Task {
    id: number;
    column_id: number;
    title: string;
    description: string | null;
    position: number;
    priority: TaskPriority;
    due_date: string | null;
    is_completed: boolean;
    completed_at: string | null;
    assignee: User | null;
    creator: User | null;
    labels: Label[];
    created_at: string | null;
    updated_at: string | null;
}

export type ActivityType = 'created' | 'updated' | 'moved' | 'deleted';

export interface Activity {
    id: number;
    task_id: number;
    type: ActivityType;
    old_value: unknown;
    new_value: unknown;
    user: User | null;
    created_at: string | null;
}

export interface TaskDetail extends Task {
    board_id: number;
    activities: Activity[];
}

export interface Column {
    id: number;
    board_id: number;
    name: string;
    position: number;
}

export interface ColumnWithTasks extends Column {
    tasks: Task[];
}

export interface BoardSummary {
    id: number;
    name: string;
    description: string | null;
    visibility: BoardVisibility;
    position: number;
    owner: User;
    member_count?: number;
    task_count?: number;
    created_at: string | null;
    updated_at: string | null;
}

export interface BoardDetail {
    id: number;
    name: string;
    description: string | null;
    visibility: BoardVisibility;
    position: number;
    owner: User;
    members: BoardMember[];
    labels: Label[];
    columns: ColumnWithTasks[];
    created_at: string | null;
    updated_at: string | null;
}

export interface CursorMeta {
    path: string;
    per_page: number;
    next_cursor: string | null;
    prev_cursor: string | null;
}

export interface Paginated<T> {
    data: T[];
    meta?: CursorMeta;
}

export interface DataEnvelope<T> {
    data: T;
}

export interface MessageEnvelope {
    message: string;
}
