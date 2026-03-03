import React from 'react';
import { BarChart3, Clock, CheckCircle2, TrendingUp, Repeat, Target, Loader2 } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

function getGreetingTime() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

export default function Dashboard() {
    const { tasks, projects, loading } = useData();
    const { user } = useAuth();

    // Derived Statistics
    const completedTasksCount = tasks.filter(t => t.status === 'Done').length;
    // For now, let's derive some basic stats. Later we'd pull from time_logs
    const totalHours = tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
    const productivityScore = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

    const stats = [
        { label: 'Estimated Hours (Total)', value: `${totalHours}h`, icon: Clock, change: '--', changeType: 'neutral' },
        { label: 'Tasks Completed', value: completedTasksCount.toString(), icon: CheckCircle2, change: '--', changeType: 'neutral' },
        { label: 'Completion Rate', value: `${productivityScore}%`, icon: TrendingUp, change: '--', changeType: 'neutral' },
    ];

    // Project Time (Mocking hour allocation based on tasks for now)
    const projectTime = projects.map((p, idx) => {
        const projectTasks = tasks.filter(t => t.project_id === p.id);
        const hours = projectTasks.reduce((sum, pt) => sum + (pt.estimated_hours || 0.5), 0); // fallback 0.5h if not set
        const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
        return {
            id: p.id,
            name: p.name,
            hours,
            color: colors[idx % colors.length]
        };
    }).filter(p => p.hours > 0).sort((a, b) => b.hours - a.hours);

    const maxHours = projectTime.length > 0 ? Math.max(...projectTime.map(p => p.hours)) : 1;

    // Habits & Goals
    const recurringTasks = tasks.filter(t => t.is_recurring).map(t => {
        // Mocking progress for MVP visuals since we don't have time logs robustly hooked up yet
        const type = t.recurrence_type || 'Daily';
        const targetMins = t.target_time_minutes || 60;
        const progressMins = t.status === 'Done' ? targetMins : (t.status === 'In Progress' ? Math.round(targetMins * 0.4) : 0);
        return {
            id: t.id,
            title: t.title,
            progressMins,
            targetMins,
            type
        };
    });

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-7xl mx-auto space-y-6"
        >
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600"
                    >
                        {getGreetingTime()}, {user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'}! 👋
                    </motion.h1>
                    <p className="text-surface-500 mt-1 font-medium">Here is your productivity overview.</p>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 + idx * 0.1 }}
                        key={idx}
                        className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow"
                    >
                        <div>
                            <p className="text-sm font-medium text-surface-500">{stat.label}</p>
                            <p className="text-3xl font-bold text-surface-900 mt-2">{stat.value}</p>
                            <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600 font-medium">
                                <span>{stat.change}</span>
                                <span className="text-surface-400 font-normal">vs last week</span>
                            </div>
                        </div>
                        <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
                            <stat.icon className="w-6 h-6" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts / Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                    className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-surface-900">Time by Project</h2>
                        <BarChart3 className="text-surface-400 w-5 h-5" />
                    </div>
                    <div className="space-y-5">
                        {projectTime.length === 0 ? (
                            <p className="text-surface-500 text-sm">No tasks assigned to projects yet.</p>
                        ) : (
                            projectTime.map((project) => (
                                <div key={project.id}>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm font-medium text-surface-700 truncate pr-4">{project.name}</span>
                                        <span className="text-sm font-bold text-surface-900">{project.hours}h</span>
                                    </div>
                                    <div className="w-full bg-surface-100 rounded-full h-2.5 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(project.hours / maxHours) * 100}%` }}
                                            transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                                            className={`h-2.5 rounded-full ${project.color}`}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-surface-900">Habits & Goals</h2>
                        </div>
                        <Repeat className="text-surface-400 w-5 h-5" />
                    </div>

                    <div className="space-y-5">
                        {recurringTasks.length === 0 ? (
                            <p className="text-surface-500 text-sm">No recurring tasks or habits set up yet.</p>
                        ) : (
                            recurringTasks.map((task) => {
                                const percent = Math.min(100, Math.round((task.progressMins / task.targetMins) * 100));
                                const isComplete = percent >= 100;

                                return (
                                    <div key={task.id}>
                                        <div className="flex justify-between items-end mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-surface-700 truncate">{task.title}</span>
                                                <span className="text-[10px] uppercase font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{task.type}</span>
                                            </div>
                                            <span className="text-sm font-bold text-surface-900">
                                                {task.progressMins} / {task.targetMins}m
                                            </span>
                                        </div>
                                        <div className="w-full bg-surface-100 rounded-full h-2.5 overflow-hidden flex">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percent}%` }}
                                                transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
                                                className={`h-2.5 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-primary-500'}`}
                                            />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
