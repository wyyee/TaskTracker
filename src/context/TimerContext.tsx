import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ActiveTimer {
    taskId: string;
    taskTitle: string;
    startTime: string; // ISO string
}

interface TimerContextType {
    isTimerRunning: boolean;
    activeTask: { id: string; title: string } | null;
    elapsedSeconds: number;
    startTimer: (taskId: string, taskTitle: string) => void;
    stopTimer: () => Promise<void>;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Load timer state from local storage on mount
    useEffect(() => {
        const savedTimer = localStorage.getItem('tasktracker_active_timer');
        if (savedTimer) {
            try {
                const parsed = JSON.parse(savedTimer) as ActiveTimer;
                setActiveTimer(parsed);
            } catch (e) {
                console.error('Failed to parse saved timer', e);
            }
        }
    }, []);

    // Timer tick logic
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (activeTimer) {
            // Calculate initial elapsed based on start time vs now
            const start = new Date(activeTimer.startTime).getTime();

            const updateElapsed = () => {
                const now = new Date().getTime();
                setElapsedSeconds(Math.floor((now - start) / 1000));
            };

            updateElapsed(); // Run immediately
            interval = setInterval(updateElapsed, 1000);
        } else {
            setElapsedSeconds(0);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeTimer]);

    const startTimer = (taskId: string, taskTitle: string) => {
        if (!user) return; // Must be logged in

        const newTimer: ActiveTimer = {
            taskId,
            taskTitle,
            startTime: new Date().toISOString()
        };

        setActiveTimer(newTimer);
        localStorage.setItem('tasktracker_active_timer', JSON.stringify(newTimer));
    };

    const stopTimer = async () => {
        if (!activeTimer || !user) return;

        const endTime = new Date();
        const startTime = new Date(activeTimer.startTime);
        const durationMinutes = Math.max(1, Math.floor((endTime.getTime() - startTime.getTime()) / 60000)); // Minimum 1 min

        try {
            // Save to Supabase
            const { error } = await supabase.from('time_logs').insert([{
                task_id: activeTimer.taskId,
                start_time: activeTimer.startTime,
                end_time: endTime.toISOString(),
                duration_minutes: durationMinutes
            }]);

            if (error) {
                console.error('Error saving time log to database:', error);
                // Depending on requirements, we might want to keep the timer running if save fails
                // For now, we'll alert and still clear it or maybe throw.
                throw error;
            }

            // Clear local state
            setActiveTimer(null);
            setElapsedSeconds(0);
            localStorage.removeItem('tasktracker_active_timer');

        } catch (error) {
            alert('Failed to save time log. Please try again.');
        }
    };

    return (
        <TimerContext.Provider value={{
            isTimerRunning: !!activeTimer,
            activeTask: activeTimer ? { id: activeTimer.taskId, title: activeTimer.taskTitle } : null,
            elapsedSeconds,
            startTimer,
            stopTimer
        }}>
            {children}
        </TimerContext.Provider>
    );
}

export function useTimer() {
    const context = useContext(TimerContext);
    if (context === undefined) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
}
