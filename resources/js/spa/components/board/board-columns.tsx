import { useCallback, useMemo, useRef, useState } from 'react';
import {
    closestCenter,
    CollisionDetection,
    defaultDropAnimationSideEffects,
    DndContext,
    DragEndEvent,
    DragMoveEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    DropAnimation,
    getFirstCollision,
    KeyboardSensor,
    MeasuringStrategy,
    MouseSensor,
    pointerWithin,
    rectIntersection,
    TouchSensor,
    UniqueIdentifier,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/ui/button';
import { BoardColumn } from '@/spa/components/board/board-column';
import { TaskCardContent } from '@/spa/components/board/task-card';
import {
    columnDndId,
    isColumnDndId,
    isTaskDndId,
    taskDndId,
} from '@/spa/lib/dnd-ids';
import type { ColumnWithTasks, Task } from '@/spa/types';

interface BoardColumnsProps {
    columns: ColumnWithTasks[];
    canManage: boolean;
    canEdit: boolean;
    onColumnsChange: Dispatch<SetStateAction<ColumnWithTasks[]>>;
    onMoveTask: (taskId: number, columnId: number, position: number) => void;
    onAddTask: (column: ColumnWithTasks) => void;
    onAddColumn: () => void;
    onRename: (column: ColumnWithTasks) => void;
    onMoveColumn: (
        column: ColumnWithTasks,
        direction: 'left' | 'right',
    ) => void;
    onDeleteColumn: (column: ColumnWithTasks) => void;
    onOpenTask: (task: Task) => void;
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

function slotPosition(tasks: Task[], index: number): number {
    const prev = index > 0 ? tasks[index - 1].position : 0;

    if (index >= tasks.length - 1) {
        return prev + 1;
    }

    const next = tasks[index + 1].position;

    if (next - prev >= 2) {
        return prev + 1;
    }

    return (prev + next) / 2;
}

export function BoardColumns({
    columns,
    canManage,
    canEdit,
    onColumnsChange,
    onMoveTask,
    onAddTask,
    onAddColumn,
    onRename,
    onMoveColumn,
    onDeleteColumn,
    onOpenTask,
}: BoardColumnsProps): React.JSX.Element {
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [overContainerId, setOverContainerId] = useState<number | null>(null);
    const lastOverId = useRef<UniqueIdentifier | null>(null);
    const recentlyMovedToNewContainer = useRef(false);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: { distance: 4 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 120, tolerance: 6 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const items = useMemo(() => {
        const record: Record<string, string[]> = {};

        for (const column of columns) {
            record[columnDndId(column.id)] = column.tasks.map((task) =>
                taskDndId(task.id),
            );
        }

        return record;
    }, [columns]);

    const findContainer = useCallback(
        (id: UniqueIdentifier): string | undefined => {
            const key = String(id);

            if (isColumnDndId(key)) {
                return key;
            }

            if (isTaskDndId(key)) {
                return Object.keys(items).find((columnKey) =>
                    items[columnKey].includes(key),
                );
            }

            return undefined;
        },
        [items],
    );

    const collisionDetectionStrategy: CollisionDetection = useCallback(
        (args) => {
            const activeId = String(args.active.id);

            if (isColumnDndId(activeId)) {
                return closestCenter({
                    ...args,
                    droppableContainers: args.droppableContainers.filter(
                        (container) => String(container.id) !== activeId,
                    ),
                });
            }

            const pointerIntersections = pointerWithin(args);
            const intersections =
                pointerIntersections.length > 0
                    ? pointerIntersections
                    : rectIntersection(args);
            let overId = getFirstCollision(intersections, 'id');

            if (overId != null) {
                const overKey = String(overId);

                if (isColumnDndId(overKey)) {
                    const containerItems = items[overKey] ?? [];

                    if (containerItems.length > 0) {
                        overId = closestCenter({
                            ...args,
                            droppableContainers:
                                args.droppableContainers.filter(
                                    (container) =>
                                        String(container.id) !== overKey &&
                                        containerItems.includes(
                                            String(container.id),
                                        ),
                                ),
                        })[0]?.id;
                    }
                }

                lastOverId.current = overId;

                return overId !== null ? [{ id: overId }] : [];
            }

            if (recentlyMovedToNewContainer.current) {
                lastOverId.current = args.active.id;
            }

            return lastOverId.current !== null
                ? [{ id: lastOverId.current }]
                : [];
        },
        [items],
    );

    const handleDragStart = useCallback(
        ({ active }: DragStartEvent) => {
            const activeKey = String(active.id);

            if (!isTaskDndId(activeKey)) {
                return;
            }

            const taskId = Number(activeKey.slice('task:'.length));
            const task = columns
                .flatMap((column) => column.tasks)
                .find((candidate) => candidate.id === taskId);

            setActiveTask(task ?? null);
        },
        [columns],
    );

    const handleDragOver = useCallback(
        ({ active, over }: DragOverEvent) => {
            const overId = over?.id;

            if (overId == null || isColumnDndId(String(active.id))) {
                return;
            }

            const activeContainer = findContainer(active.id);
            const overContainer = findContainer(overId);

            if (
                !activeContainer ||
                !overContainer ||
                activeContainer === overContainer
            ) {
                return;
            }

            const overKey = String(overId);
            const activeKey = String(active.id);

            onColumnsChange((current: ColumnWithTasks[]) => {
                const activeColumn = current.find(
                    (column) => columnDndId(column.id) === activeContainer,
                );
                const overColumn = current.find(
                    (column) => columnDndId(column.id) === overContainer,
                );

                if (!activeColumn || !overColumn) {
                    return current;
                }

                const activeIndex = activeColumn.tasks.findIndex(
                    (task) => taskDndId(task.id) === activeKey,
                );
                const activeTask = activeColumn.tasks[activeIndex];

                if (activeTask === undefined) {
                    return current;
                }

                const overIndex = overColumn.tasks.findIndex(
                    (task) => taskDndId(task.id) === overKey,
                );

                let newIndex: number;

                if (isColumnDndId(overKey)) {
                    newIndex = overColumn.tasks.length + 1;
                } else {
                    const isBelowOverItem =
                        over !== null &&
                        active.rect.current.translated !== null &&
                        over.rect.top + over.rect.height / 2 <
                            active.rect.current.translated.top;

                    const modifier = isBelowOverItem ? 1 : 0;

                    newIndex =
                        overIndex >= 0
                            ? overIndex + modifier
                            : overColumn.tasks.length + 1;
                }

                recentlyMovedToNewContainer.current = true;

                return current.map((column) => {
                    if (columnDndId(column.id) === activeContainer) {
                        return {
                            ...column,
                            tasks: column.tasks.filter(
                                (task) => task.id !== activeTask.id,
                            ),
                        };
                    }

                    if (columnDndId(column.id) === overContainer) {
                        const updatedTask = {
                            ...activeTask,
                            column_id: overColumn.id,
                        };
                        const nextTasks = [...overColumn.tasks];
                        nextTasks.splice(
                            Math.min(newIndex, nextTasks.length),
                            0,
                            updatedTask,
                        );
                        return { ...column, tasks: nextTasks };
                    }

                    return column;
                });
            });
        },
        [findContainer, onColumnsChange],
    );

    const handleDragEnd = useCallback(
        ({ active, over }: DragEndEvent) => {
            setActiveTask(null);
            setOverContainerId(null);

            if (over == null) {
                recentlyMovedToNewContainer.current = false;
                return;
            }

            const activeId = String(active.id);
            const overId = String(over.id);
            const activeContainer = findContainer(activeId);

            if (!activeContainer) {
                recentlyMovedToNewContainer.current = false;
                return;
            }

            const overContainer = findContainer(overId) ?? activeContainer;
            const column = columns.find(
                (candidate) => columnDndId(candidate.id) === overContainer,
            );

            if (!column) {
                recentlyMovedToNewContainer.current = false;
                return;
            }

            const activeIndex = column.tasks.findIndex(
                (task) => taskDndId(task.id) === activeId,
            );
            const overIndex = column.tasks.findIndex(
                (task) => taskDndId(task.id) === overId,
            );

            let finalTasks: Task[] = column.tasks;

            if (
                activeIndex !== -1 &&
                overIndex !== -1 &&
                activeIndex !== overIndex
            ) {
                finalTasks = arrayMove(column.tasks, activeIndex, overIndex);
                onColumnsChange((current: ColumnWithTasks[]) =>
                    current.map((candidate) =>
                        candidate.id === column.id
                            ? { ...candidate, tasks: finalTasks }
                            : candidate,
                    ),
                );
            }

            const movedTaskId = Number(activeId.slice('task:'.length));
            const finalIndex = finalTasks.findIndex(
                (task) => task.id === movedTaskId,
            );

            if (finalIndex !== -1) {
                const position = slotPosition(finalTasks, finalIndex);
                onMoveTask(movedTaskId, column.id, position);
            } else {
                const index = column.tasks.findIndex(
                    (task) => task.id === movedTaskId,
                );

                if (index !== -1) {
                    const position = slotPosition(column.tasks, index);
                    onMoveTask(movedTaskId, column.id, position);
                }
            }

            recentlyMovedToNewContainer.current = false;
        },
        [columns, findContainer, onColumnsChange, onMoveTask],
    );

    const handleDragCancel = useCallback(() => {
        setActiveTask(null);
        setOverContainerId(null);
        recentlyMovedToNewContainer.current = false;
    }, []);

    const handleDragMove = useCallback(
        ({ over }: DragMoveEvent) => {
            if (over == null) {
                setOverContainerId(null);
                return;
            }

            const container = findContainer(over.id);

            if (container !== undefined) {
                setOverContainerId(Number(container.slice('column:'.length)));
            }
        },
        [findContainer],
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={collisionDetectionStrategy}
            measuring={{
                droppable: {
                    strategy: MeasuringStrategy.Always,
                },
            }}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            onDragMove={handleDragMove}
        >
            <div className="flex h-full items-start gap-4 overflow-x-auto px-4 py-6 sm:px-6">
                {columns.map((column) => (
                    <BoardColumn
                        key={column.id}
                        column={column}
                        isOver={overContainerId === column.id}
                        canManage={canManage}
                        canEdit={canEdit}
                        onAddTask={onAddTask}
                        onRename={onRename}
                        onMove={onMoveColumn}
                        onDelete={onDeleteColumn}
                        onOpenTask={onOpenTask}
                    />
                ))}

                {canManage ? (
                    <div className="w-72 shrink-0">
                        <Button
                            variant="outline"
                            className="text-muted-foreground w-full border-dashed"
                            onClick={onAddColumn}
                        >
                            <Plus className="size-4" aria-hidden="true" />
                            Add column
                        </Button>
                    </div>
                ) : null}
            </div>

            <DragOverlay adjustScale={false} dropAnimation={dropAnimation}>
                {activeTask !== null ? (
                    <div className="bg-card w-72 cursor-grabbing rounded-lg border p-3 shadow-lg">
                        <TaskCardContent task={activeTask} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
