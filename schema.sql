-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects Table
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tasks Table
CREATE TABLE tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE, -- Made optional for standalone habits
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
    status TEXT CHECK (status IN ('To Do', 'In Progress', 'Done')) DEFAULT 'To Do',
    is_recurring BOOLEAN DEFAULT false,
    recurrence_type TEXT CHECK (recurrence_type IN ('Daily', 'Weekly')),
    target_time_minutes INTEGER, -- Goal time per day/week
    estimated_hours NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Time Logs Table
CREATE TABLE time_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) Setup

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- Policies for projects
CREATE POLICY "Users can view their own projects" 
    ON projects FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" 
    ON projects FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
    ON projects FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
    ON projects FOR DELETE 
    USING (auth.uid() = user_id);

-- Policies for tasks
CREATE POLICY "Users can view their own tasks" 
    ON tasks FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" 
    ON tasks FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
    ON tasks FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
    ON tasks FOR DELETE 
    USING (auth.uid() = user_id);

-- Policies for time logs
CREATE POLICY "Users can view time logs of their tasks" 
    ON time_logs FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM tasks 
        WHERE tasks.id = time_logs.task_id AND tasks.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert time logs to their tasks" 
    ON time_logs FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM tasks 
        WHERE tasks.id = time_logs.task_id AND tasks.user_id = auth.uid()
    ));

CREATE POLICY "Users can update time logs of their tasks" 
    ON time_logs FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM tasks 
        WHERE tasks.id = time_logs.task_id AND tasks.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete time logs of their tasks" 
    ON time_logs FOR DELETE 
    USING (EXISTS (
        SELECT 1 FROM tasks 
        WHERE tasks.id = time_logs.task_id AND tasks.user_id = auth.uid()
    ));
