import React, { useState } from 'react';
import { X, Save, Loader2, FolderPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function ProjectModal({ isOpen, onClose, onSuccess }: ProjectModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const resetForm = () => {
        setName('');
        setDescription('');
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        const projectData = {
            user_id: user.id,
            name,
            description: description || null,
            status: 'Active'
        };

        try {
            const { error: insertError } = await supabase
                .from('projects')
                .insert([projectData]);

            if (insertError) throw insertError;

            onSuccess?.();
            onClose();
            resetForm();
        } catch (err: any) {
            console.error('Error saving project:', err);
            setError(err.message || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 bg-surface-50/50">
                    <div className="flex items-center gap-2">
                        <FolderPlus className="w-5 h-5 text-primary-600" />
                        <h2 className="text-lg font-bold text-surface-900">New Project</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-surface-700 mb-1">
                                Project Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-surface-900 placeholder:text-surface-400 font-medium"
                                placeholder="E.g., Client Website Redesign"
                            />
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
                                placeholder="Brief details about the project..."
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-surface-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-surface-700 hover:text-surface-900 hover:bg-surface-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name}
                            className="flex items-center justify-center min-w-[120px] gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Create Project
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
