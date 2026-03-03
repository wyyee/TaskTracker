import React, { useState, useEffect } from 'react';
import { X, Save, Clock, Repeat, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Project, Task } from '../../hooks/useData';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    taskToEdit?: Task | null;
    onSuccess?: () => void;
}

export default function TaskModal({ isOpen, onClose, projects, taskToEdit, onSuccess }: TaskModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [projectId, setProjectId] = useState<string>('');
    const [status, setStatus] = useState<'To Do' | 'In Progress' | 'Done'>('To Do');
    const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceType, setRecurrenceType] = useState<'Daily' | 'Weekly'>('Daily');
    const [targetTime, setTargetTime] = useState<number | ''>('');
    const [estimatedHours, setEstimatedHours] = useState<number | ''>('');

    useEffect(() => {
        if (taskToEdit) {
            setTitle(taskToEdit.title);
            setDescription(taskToEdit.description || '');
            setProjectId(taskToEdit.project_id || '');
            setStatus((taskToEdit.status as 'To Do' | 'In Progress' | 'Done') || 'To Do');
            setPriority(taskToEdit.priority);
            setIsRecurring(taskToEdit.is_recurring);
            if (taskToEdit.recurrence_type) setRecurrenceType(taskToEdit.recurrence_type);
            setTargetTime(taskToEdit.target_time_minutes || '');
            setEstimatedHours(taskToEdit.estimated_hours || '');
        } else {
            resetForm();
        }
    }, [taskToEdit, isOpen]);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setProjectId('');
        setStatus('To Do');
        setPriority('Medium');
        setIsRecurring(false);
        setRecurrenceType('Daily');
        setTargetTime('');
        setEstimatedHours('');
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        const taskData = {
            user_id: user.id,
            title,
            description: description || null,
            project_id: projectId || null,
            status,
            priority,
            is_recurring: isRecurring,
            recurrence_type: isRecurring ? recurrenceType : null,
            target_time_minutes: isRecurring && targetTime ? Number(targetTime) : null,
            estimated_hours: estimatedHours ? Number(estimatedHours) : null,
        };

        try {
            if (taskToEdit) {
                const { error: updateError } = await supabase
                    .from('tasks')
                    .update(taskData)
                    .eq('id', taskToEdit.id);

                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('tasks')
                    .insert([taskData]);

                if (insertError) throw insertError;
            }

            onSuccess?.();
            onClose();
            resetForm();
        } catch (err: any) {
            console.error('Error saving task:', err);
            setError(err.message || 'Failed to save task');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!taskToEdit || !window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;

        setDeleting(true);
        setError(null);

        try {
            const { error: deleteError } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskToEdit.id);

            if (deleteError) throw deleteError;

            onSuccess?.();
            onClose();
            resetForm();
        } catch (err: any) {
            console.error('Error deleting task:', err);
            setError(err.message || 'Failed to delete task');
        } finally {
            setDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 bg-surface-50/50">
                    <h2 className="text-lg font-bold text-surface-900">
                        {taskToEdit ? 'Edit Task' : 'New Task'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-5">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-surface-700 mb-1">
                                Task Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-surface-900 placeholder:text-surface-400 font-medium"
                                placeholder="E.g., Design homepage mockup"
                            />
                        </div>

                        <div>
                            <label htmlFor="project" className="block text-sm font-medium text-surface-700 mb-1">
                                Project (Optional)
                            </label>
                            <select
                                id="project"
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-surface-900"
                            >
                                <option value="">No Project (Standalone Task/Habit)</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-surface-700 mb-1">
                                    Status
                                </label>
                                <select
                                    id="status"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-surface-900"
                                >
                                    <option value="To Do">To Do</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Done">Done</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="priority" className="block text-sm font-medium text-surface-700 mb-1">
                                    Priority
                                </label>
                                <select
                                    id="priority"
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-surface-900"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="estimatedHours" className="block text-sm font-medium text-surface-700 mb-1">
                                    Est. Hours (Optional)
                                </label>
                                <input
                                    type="number"
                                    id="estimatedHours"
                                    min="0"
                                    step="0.5"
                                    value={estimatedHours}
                                    onChange={(e) => setEstimatedHours(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-surface-900"
                                    placeholder="e.g. 2.5"
                                />
                            </div>
                        </div>

                        {/* Recurring Task Options */}
                        <div className="pt-4 border-t border-surface-100">
                            <label className="flex items-center gap-2 cursor-pointer group mb-4">
                                <input
                                    type="checkbox"
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                    className="w-4 h-4 text-primary-600 border-surface-300 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm font-medium text-surface-900 group-hover:text-primary-700 transition-colors flex items-center gap-1.5">
                                    <Repeat className="w-4 h-4" />
                                    Make this a recurring habit / goal
                                </span>
                            </label>

                            {isRecurring && (
                                <div className="grid grid-cols-2 gap-4 p-4 bg-primary-50/50 border border-primary-100 rounded-xl">
                                    <div>
                                        <label className="block text-xs font-bold text-primary-900 mb-1">
                                            Frequency
                                        </label>
                                        <div className="flex bg-white rounded-lg border border-primary-200 p-1">
                                            <button
                                                type="button"
                                                onClick={() => setRecurrenceType('Daily')}
                                                className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${recurrenceType === 'Daily' ? 'bg-primary-100 text-primary-700 shadow-sm' : 'text-surface-500 hover:bg-surface-50'}`}
                                            >
                                                Daily
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRecurrenceType('Weekly')}
                                                className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${recurrenceType === 'Weekly' ? 'bg-primary-100 text-primary-700 shadow-sm' : 'text-surface-500 hover:bg-surface-50'}`}
                                            >
                                                Weekly
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="targetMins" className="block text-xs font-bold text-primary-900 mb-1 flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            Target Time (mins)
                                        </label>
                                        <input
                                            type="number"
                                            id="targetMins"
                                            min="1"
                                            value={targetTime}
                                            onChange={(e) => setTargetTime(e.target.value ? Number(e.target.value) : '')}
                                            placeholder="e.g. 30"
                                            className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-surface-900 font-medium"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-surface-700 mb-1">
                                Description (Optional)
                            </label>
                            <textarea
                                id="description"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-surface-900 resize-none"
                                placeholder="Add any extra details or links..."
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between gap-3 pt-4 border-t border-surface-100">
                        <div>
                            {taskToEdit && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={loading || deleting}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    Delete
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading || deleting}
                                className="px-4 py-2 text-sm font-medium text-surface-700 hover:text-surface-900 hover:bg-surface-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || deleting || !title}
                                className="flex items-center justify-center min-w-[100px] gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {(loading && !deleting) ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        {taskToEdit ? 'Save Changes' : 'Create Task'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
