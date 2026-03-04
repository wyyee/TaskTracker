import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, Clock, MoreVertical, Plus, Repeat, Square } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

import { useData, Task } from '../hooks/useData';
import TaskModal from '../components/tasks/TaskModal';
import ProjectModal from '../components/tasks/ProjectModal';
import { useTimer } from '../context/TimerContext';

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'High': return 'bg-red-50 text-red-700 border-red-200';
        case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'Low': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        default: return 'bg-surface-50 text-surface-700 border-surface-200';
    }
};

const TaskCard = ({ task, projectName, onEdit }: { task: Task, projectName: string, onEdit: (t: Task) => void }) => {
    const { startTimer, stopTimer, activeTask, isTimerRunning } = useTimer();
    const isActive = activeTask?.id === task.id;

    return (
        <div className={`bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow group flex flex-col gap-3 ${task.is_recurring ? 'border-primary-200 bg-primary-50/10' : 'border-surface-200'} ${isActive ? 'ring-2 ring-primary-500 border-transparent shadow-md bg-primary-50/20' : ''}`}>
            <div className="flex justify-between items-start">
                <div className="flex gap-2 items-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                    </span>
                    {task.is_recurring && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded" title={`${task.recurrence_type} Goal: ${task.target_time_minutes}m`}>
                            <Repeat className="w-3 h-3" />
                            {task.recurrence_type}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => onEdit(task)}
                    className="text-surface-400 hover:text-surface-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>

            <div>
                <h3 className="text-sm font-bold text-surface-900 leading-snug">{task.title}</h3>
                <p className="text-xs text-surface-500 mt-1 line-clamp-1">{projectName}</p>
            </div>

            <div className="mt-auto pt-3 border-t border-surface-100 flex items-center justify-between">
                <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-surface-200 border-2 border-white"></div>
                </div>
                {task.status !== 'Done' && (
                    isActive ? (
                        <button
                            onClick={stopTimer}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-md text-xs font-bold transition-colors animate-pulse"
                        >
                            <Square className="w-3.5 h-3.5 fill-current" />
                            Stop
                        </button>
                    ) : (
                        <button
                            onClick={() => startTimer(task.id, task.title)}
                            disabled={isTimerRunning}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors ${isTimerRunning ? 'bg-surface-100 text-surface-400 cursor-not-allowed' : 'bg-primary-50 text-primary-700 hover:bg-primary-100'}`}
                            title={isTimerRunning ? "Another task is running" : "Start timer"}
                        >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Start
                        </button>
                    )
                )}
            </div>
        </div>
    );
};

export default function TaskBoard() {
    const { tasks: initialTasks, projects, loading, refetch } = useData();
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [tasks, setTasks] = useState<Task[]>(initialTasks);

    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // Optimistically update UI
        const newStatus = destination.droppableId as 'To Do' | 'In Progress' | 'Done';

        setTasks(prevTasks =>
            prevTasks.map(t => t.id === draggableId ? { ...t, status: newStatus } : t)
        );

        // Update database
        const { error } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', draggableId);

        if (error) {
            console.error('Error updating task status:', error);
            refetch(); // Revert on error
        }
    };

    const columns = [
        { id: 'To Do', label: 'To Do', icon: Clock, color: 'text-surface-500' },
        { id: 'In Progress', label: 'In Progress', icon: Play, color: 'text-blue-500' },
        { id: 'Done', label: 'Done', icon: CheckCircle2, color: 'text-emerald-500' }
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="h-full flex flex-col"
        >
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Task Board</h1>
                    <p className="text-surface-500 mt-1 font-medium">Manage and track your ongoing work.</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="flex items-center gap-3"
                >
                    <button
                        onClick={() => setIsProjectModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-surface-100 hover:bg-surface-200 text-surface-700 px-4 py-2 rounded-lg font-bold transition-all shadow-sm hover:shadow-md active:scale-95 border border-surface-200"
                    >
                        <Plus className="w-5 h-5" />
                        New Project
                    </button>
                    <button
                        onClick={() => { setTaskToEdit(null); setIsTaskModalOpen(true); }}
                        className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        New Task
                    </button>
                </motion.div>
            </header>

            {/* Kanban Board */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex-1 flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center text-surface-500">Loading tasks...</div>
                    ) : (
                        columns.map((col, idx) => {
                            const colTasks = tasks.filter(t => t.status === col.id);
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.1 + idx * 0.1 }}
                                    key={col.id}
                                    className="flex-shrink-0 w-80 flex flex-col h-full bg-surface-50/50 rounded-2xl p-4 border border-surface-200/60 shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <div className="flex items-center gap-2">
                                            <col.icon className={`w-5 h-5 ${col.color}`} />
                                            <h2 className="font-bold text-surface-900">{col.label}</h2>
                                            <span className="bg-surface-200 text-surface-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                                {colTasks.length}
                                            </span>
                                        </div>
                                    </div>

                                    <Droppable droppableId={col.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                className={`flex-1 overflow-y-auto space-y-3 rounded-lg transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-surface-100/50' : ''}`}
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                            >
                                                {colTasks.map((task, index) => {
                                                    const project = projects.find(p => p.id === task.project_id);
                                                    return (
                                                        <Draggable key={task.id} draggableId={task.id} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    style={{
                                                                        ...provided.draggableProps.style,
                                                                        opacity: snapshot.isDragging ? 0.9 : 1
                                                                    }}
                                                                >
                                                                    <TaskCard
                                                                        task={task}
                                                                        projectName={project?.name || 'Standalone Goal'}
                                                                        onEdit={(t) => { setTaskToEdit(t); setIsTaskModalOpen(true); }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    );
                                                })}
                                                {provided.placeholder}
                                                {colTasks.length === 0 && !snapshot.isDraggingOver && (
                                                    <div className="h-24 border-2 border-dashed border-surface-200 rounded-xl flex items-center justify-center text-surface-400 text-sm font-medium mt-3">
                                                        Drop tasks here
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Droppable>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </DragDropContext>

            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                projects={projects}
                taskToEdit={taskToEdit}
                onSuccess={refetch}
            />

            <ProjectModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                onSuccess={refetch}
            />
        </motion.div>
    );
}
