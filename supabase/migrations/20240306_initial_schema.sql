-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE user_role AS ENUM ('ADMIN', 'CLIENT');
CREATE TYPE project_status AS ENUM ('ONGOING', 'COMPLETED', 'PAUSED', 'CANCELED');
CREATE TYPE task_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE file_type AS ENUM ('IMAGE', 'VIDEO', 'LINK', 'OTHER');

-- Create tables
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role user_role DEFAULT 'CLIENT',
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    status project_status DEFAULT 'ONGOING',
    deadline TIMESTAMP WITH TIME ZONE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'PENDING',
    deadline TIMESTAMP WITH TIME ZONE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type file_type NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Clients are viewable by authenticated users" ON clients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Clients are insertable by admins" ON clients
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'ADMIN');

CREATE POLICY "Clients are updatable by admins" ON clients
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Users policies
CREATE POLICY "Users are viewable by authenticated users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users are insertable by admins" ON users
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'ADMIN');

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Projects are viewable by authenticated users" ON projects
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Projects are insertable by admins" ON projects
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'ADMIN');

CREATE POLICY "Projects are updatable by admins" ON projects
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Tasks policies
CREATE POLICY "Tasks are viewable by authenticated users" ON tasks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Tasks are insertable by admins" ON tasks
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'ADMIN');

CREATE POLICY "Tasks are updatable by admins" ON tasks
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Files policies
CREATE POLICY "Files are viewable by authenticated users" ON files
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Files are insertable by authenticated users" ON files
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Files are updatable by admins" ON files
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
    ('project-files', 'Project Files', true);

-- Storage policies
CREATE POLICY "Project files are accessible by authenticated users"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'project-files' AND auth.role() = 'authenticated');

CREATE POLICY "Project files are insertable by authenticated users"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'project-files' AND auth.role() = 'authenticated');

CREATE POLICY "Project files are updatable by admins"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'project-files' AND auth.jwt() ->> 'role' = 'ADMIN'); 