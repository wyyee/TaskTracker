import React from 'react';
import { Menu, Play, Square, Clock, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTimer } from '../../context/TimerContext';

interface TopBarProps {
    onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
    const { user, signOut } = useAuth();
    const { isTimerRunning, activeTask, elapsedSeconds, stopTimer } = useTimer();

    // Format elapsed seconds into HH:MM:SS
    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const elapsed = formatTime(elapsedSeconds);

    // Get first letter of email or name
    const initial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

    return (
        <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-4 md:px-6 z-10 sticky top-0">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 -ml-2 text-surface-600 hover:bg-surface-100 rounded-lg transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>

            {/* Global Timer Component (Mocked for now) */}
            <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border transition-all duration-300 shadow-sm ${isTimerRunning
                ? 'bg-primary-50 border-primary-200 text-primary-800'
                : 'bg-surface-50 border-surface-200 text-surface-600 hover:bg-surface-100'
                }`}>
                {isTimerRunning ? (
                    <>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500"></span>
                            </span>
                            <span className="font-mono font-medium tracking-wider w-20 text-center">{elapsed}</span>
                        </div>
                        <div className="h-4 w-px bg-primary-200 mx-1"></div>
                        <div className="hidden sm:block text-sm max-w-[200px] truncate pr-2">
                            {activeTask?.title || "No active task"}
                        </div>
                        <button
                            onClick={() => stopTimer()}
                            className="p-1 hover:bg-primary-200 rounded-full text-red-500 transition-colors"
                            title="Stop Timer"
                        >
                            <Square className="w-4 h-4 fill-current" />
                        </button>
                    </>
                ) : (
                    <>
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium mr-1 tracking-wide font-mono">00:00:00</span>
                    </>
                )}
            </div>

            <div className="flex items-center gap-3">
                {/* User profile / actions */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-primary-300 flex items-center justify-center text-white font-semibold shadow-sm" title={user?.email || 'User'}>
                    {initial}
                </div>
                <button
                    onClick={() => signOut()}
                    className="p-2 text-surface-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Sign Out"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
