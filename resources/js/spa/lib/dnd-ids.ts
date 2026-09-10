export function columnDndId(columnId: number): string {
    return `column:${columnId}`;
}

export function taskDndId(taskId: number): string {
    return `task:${taskId}`;
}

export function isColumnDndId(id: string): boolean {
    return id.startsWith('column:');
}

export function isTaskDndId(id: string): boolean {
    return id.startsWith('task:');
}
