import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Project {
    id: string;
    name: string;
    description?: string;
    status: string;
}

export interface Task {
    id: string;
    project_id?: string;
    title: string;
    description?: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'To Do' | 'In Progress' | 'Done';
    is_recurring: boolean;
    recurrence_type?: 'Daily' | 'Weekly';
    target_time_minutes?: number;
    estimated_hours?: number;
}

export interface TimeLog {
    id: string;
    task_id: string;
    start_time: string;
    end_time: string | null;
    duration_minutes: number | null;
}

export function useData() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        fetchData();

        // Set up real-time subscriptions
        const projectsSub = supabase
            .channel('projects-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchData)
            .subscribe();

        const tasksSub = supabase
            .channel('tasks-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchData)
            .subscribe();

        const timeLogsSub = supabase
            .channel('time_logs-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'time_logs' }, fetchData)
            .subscribe();

        return () => {
            supabase.removeChannel(projectsSub);
            supabase.removeChannel(tasksSub);
            supabase.removeChannel(timeLogsSub);
        };
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [projectsResponse, tasksResponse, timeLogsResponse] = await Promise.all([
                supabase.from('projects').select('*').order('created_at', { ascending: true }),
                supabase.from('tasks').select('*').order('created_at', { ascending: false }),
                supabase.from('time_logs').select('*').order('start_time', { ascending: false }),
            ]);

            if (projectsResponse.error) throw projectsResponse.error;
            if (tasksResponse.error) throw tasksResponse.error;
            if (timeLogsResponse.error) throw timeLogsResponse.error;

            setProjects(projectsResponse.data || []);
            setTasks(tasksResponse.data || []);
            setTimeLogs(timeLogsResponse.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    return { projects, tasks, timeLogs, loading, refetch: fetchData };
}
