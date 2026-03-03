import React, { useState, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, PieChart, Pie, Legend } from 'recharts';
import { Calendar, ChevronDown, Target, PieChart as PieChartIcon } from 'lucide-react';
import { useData } from '../hooks/useData';

export default function Reports() {
    const { tasks, projects, timeLogs, loading } = useData();
    const [dateRange, setDateRange] = useState<'7days' | '30days'>('7days');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [dailyGoal, setDailyGoal] = useState<number>(() => {
        const saved = localStorage.getItem('tasktracker_daily_goal');
        return saved ? Number(saved) : 0;
    });

    const handleGoalChange = (val: number) => {
        setDailyGoal(val);
        localStorage.setItem('tasktracker_daily_goal', val.toString());
    };

    // Process data for charts and tables
    const { chartData, logsForSelectedDate, pieData } = useMemo(() => {
        const daysToLookBack = dateRange === '7days' ? 7 : 30;
        const endDate = endOfDay(new Date());
        const startDate = startOfDay(subDays(endDate, daysToLookBack - 1));

        // Initialize chart data with 0s for all days in range
        const dailyTotals: Record<string, number> = {};
        for (let i = daysToLookBack - 1; i >= 0; i--) {
            const d = format(subDays(endDate, i), 'yyyy-MM-dd');
            dailyTotals[d] = 0;
        }

        // Filter relevant logs
        const relevantLogs = timeLogs.filter(log => {
            if (!log.end_time || !log.duration_minutes) return false;
            const logDate = parseISO(log.start_time);
            return isWithinInterval(logDate, { start: startDate, end: endDate });
        });

        // Populate daily totals
        relevantLogs.forEach(log => {
            const d = format(parseISO(log.start_time), 'yyyy-MM-dd');
            if (dailyTotals[d] !== undefined) {
                dailyTotals[d] += log.duration_minutes || 0;
            }
        });

        // Format for Recharts
        const chartData = Object.entries(dailyTotals).map(([date, mins]) => ({
            date,
            displayDate: format(parseISO(date), 'MMM d'),
            hours: Number((mins / 60).toFixed(1)), // Convert to hours for chart y-axis
            minutes: mins
        }));

        // If a specific date is clicked on the chart, get its logs
        const logsForSelectedDate = selectedDate
            ? relevantLogs
                .filter(log => format(parseISO(log.start_time), 'yyyy-MM-dd') === selectedDate)
                .map(log => {
                    const task = tasks.find(t => t.id === log.task_id);
                    const project = projects.find(p => p.id === task?.project_id);
                    return {
                        ...log,
                        taskTitle: task?.title || 'Unknown Task',
                        projectName: project?.name || 'Standalone Task'
                    };
                })
                .sort((a, b) => parseISO(b.start_time).getTime() - parseISO(a.start_time).getTime())
            : [];

        // Project Breakdown
        const projectTotals: Record<string, { mins: number, name: string }> = {};

        relevantLogs.forEach(log => {
            const task = tasks.find(t => t.id === log.task_id);
            const project = projects.find(p => p.id === task?.project_id);
            const key = project?.id || 'unassigned';
            const projName = project?.name || 'No Project';

            if (!projectTotals[key]) {
                projectTotals[key] = { mins: 0, name: projName };
            }
            projectTotals[key].mins += log.duration_minutes || 0;
        });

        // Format for PieChart
        const pieData = Object.values(projectTotals)
            .filter(pt => pt.mins > 0)
            .map(pt => ({
                name: pt.name,
                value: Number((pt.mins / 60).toFixed(1)),
                mins: pt.mins
            }))
            .sort((a, b) => b.value - a.value);

        return { chartData, logsForSelectedDate, pieData };
    }, [timeLogs, tasks, projects, dateRange, selectedDate]);

    const totalTimeInRangeMins = chartData.reduce((sum, day) => sum + day.minutes, 0);
    const avgTimePerDayMins = Math.round(totalTimeInRangeMins / (dateRange === '7days' ? 7 : 30));

    const formatMinsToHours = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-surface-900">Time Reports</h1>
                    <p className="text-surface-500 mt-1">Analyze your productivity trends.</p>
                </div>

                <div className="relative">
                    <select
                        value={dateRange}
                        onChange={(e) => {
                            setDateRange(e.target.value as '7days' | '30days');
                            setSelectedDate(null); // reset selection on range change
                        }}
                        className="appearance-none bg-white border border-surface-200 text-surface-700 py-2 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                    >
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-surface-400 pointer-events-none" />
                </div>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm">
                    <p className="text-sm font-medium text-surface-500">Total Time ({dateRange === '7days' ? '7d' : '30d'})</p>
                    <p className="text-3xl font-bold text-surface-900 mt-2">{formatMinsToHours(totalTimeInRangeMins)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm">
                    <p className="text-sm font-medium text-surface-500">Daily Average</p>
                    <p className="text-3xl font-bold text-surface-900 mt-2">{formatMinsToHours(avgTimePerDayMins)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-surface-500 mb-1">
                            <Target className="w-4 h-4" />
                            <p className="text-sm font-medium">Daily Goal (Hours)</p>
                        </div>
                        <p className="text-xs text-surface-400">Target to hit each day</p>
                    </div>
                    <div className="mt-3">
                        <input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            value={dailyGoal || ''}
                            onChange={(e) => handleGoalChange(Number(e.target.value))}
                            placeholder="e.g. 4"
                            className="block w-full text-2xl font-bold text-surface-900 bg-surface-50 border border-surface-200 rounded-lg p-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Main Chart */}
            <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-surface-900">Daily Activity (Hours)</h2>
                    <Calendar className="text-surface-400 w-5 h-5" />
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                            <XAxis
                                dataKey="displayDate"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                            />
                            <Tooltip
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: any) => [`${value} hours`, 'Time Logged']}
                            />
                            {dailyGoal > 0 && (
                                <ReferenceLine y={dailyGoal} stroke="#10b981" strokeDasharray="3 3" />
                            )}
                            <Bar
                                dataKey="hours"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={50}
                                className="cursor-pointer"
                                onClick={(data: any) => {
                                    if (data && data.date) {
                                        setSelectedDate(data.date === selectedDate ? null : data.date);
                                    }
                                }}
                            >
                                {chartData.map((entry, index) => {
                                    const isSelected = selectedDate === entry.date;
                                    const metGoal = dailyGoal > 0 && entry.hours >= dailyGoal;

                                    // Base color depending on goal status
                                    let baseColor = '#38bdf8'; // Default blue
                                    if (metGoal) baseColor = '#10b981'; // Green if hit goal

                                    // Highlight selected
                                    if (isSelected) {
                                        baseColor = metGoal ? '#059669' : '#0ea5e9'; // Darker variants
                                    }

                                    return <Cell key={`cell-${index}`} fill={baseColor} />;
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-xs text-center text-surface-400 mt-4">Click on a bar to see detailed logs for that day.</p>
            </div>

            {/* Project Distribution Chart */}
            <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm mt-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-surface-900">Time by Project (Hours)</h2>
                    <PieChartIcon className="text-surface-400 w-5 h-5" />
                </div>

                {pieData.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-surface-400">
                        No project data for this period
                    </div>
                ) : (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {pieData.map((entry: any, index: number) => {
                                        const colors = ['#0ea5e9', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#f59e0b', '#10b981'];
                                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                    })}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`${value} hours`, 'Time Logged']}
                                />
                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Drill-down View */}
            {selectedDate && (
                <div className="bg-white p-6 rounded-xl border border-primary-200 shadow-md animate-in slide-in-from-bottom-2 fade-in duration-200">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-surface-100">
                        <div>
                            <h3 className="text-lg font-bold text-surface-900">
                                Logs for {format(parseISO(selectedDate), 'MMMM do, yyyy')}
                            </h3>
                            <p className="text-sm text-surface-500 mt-1">
                                Total: {formatMinsToHours(chartData.find(d => d.date === selectedDate)?.minutes || 0)}
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedDate(null)}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-md"
                        >
                            Close Details
                        </button>
                    </div>

                    {logsForSelectedDate.length === 0 ? (
                        <p className="text-surface-500 py-4 text-center">No time logged on this day.</p>
                    ) : (
                        <div className="space-y-3">
                            {logsForSelectedDate.map(log => (
                                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hovering:bg-surface-50 rounded-lg border border-surface-100">
                                    <div className="mb-2 sm:mb-0">
                                        <p className="font-semibold text-surface-900">{log.taskTitle}</p>
                                        <p className="text-xs text-surface-500">{log.projectName}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm whitespace-nowrap">
                                        <div className="text-surface-500">
                                            {format(parseISO(log.start_time), 'h:mm a')} - {log.end_time ? format(parseISO(log.end_time), 'h:mm a') : 'Running'}
                                        </div>
                                        <div className="font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md min-w-[4rem] text-center">
                                            {formatMinsToHours(log.duration_minutes || 0)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
