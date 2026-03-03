import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, KanbanSquare, BarChart3, X } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Tasks', path: '/tasks', icon: KanbanSquare },
        { name: 'Reports', path: '/reports', icon: BarChart3 },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-surface-900/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Content */}
            <aside
                className={`fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-surface-200 z-30 transform transition-transform duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
            >
                <div className="h-16 flex items-center justify-between px-6 border-b border-surface-100">
                    <div className="flex items-center gap-2 text-primary-600">
                        <img src="/Logo.png" alt="TaskTracker Logo" className="w-8 h-8 object-contain" />
                        <span className="text-xl font-bold tracking-tight text-surface-900">TaskTracker</span>
                    </div>
                    <button
                        className="md:hidden text-surface-500 hover:text-surface-700"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                                }
              `}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-surface-100 text-xs text-surface-400 text-center">
                    &copy; 2026 TaskTracker
                </div>
            </aside>
        </>
    );
}
