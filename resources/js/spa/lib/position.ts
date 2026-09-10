import type { Task } from '@/spa/types';

/**
 * Compute a server-friendly `position` value for a task inserted at `index`
 * (0-based) within the ordered `tasks` list. The value is strictly greater
 * than the previous sibling and strictly lower than the next sibling, or
 * simply "previous + 1" when appended at the end.
 */
export function slotPosition(tasks: Task[], index: number): number {
    const prev = index > 0 ? tasks[index - 1].position : 0;

    if (index >= tasks.length) {
        return prev + 1;
    }

    const next = tasks[index].position;

    if (next - prev >= 2) {
        return prev + 1;
    }

    return (prev + next) / 2;
}
