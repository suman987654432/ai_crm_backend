-- 001_init_agents.sql
-- Enable UUID extension if not already enabled (Neon usually supports this out of the box)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Agents Table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    language VARCHAR(100) NOT NULL,
    primary_goal TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Agent AI Configs
CREATE TABLE IF NOT EXISTS agent_ai_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    llm_provider VARCHAR(100) NOT NULL,
    llm_model VARCHAR(100) NOT NULL,
    system_prompt TEXT,
    greeting_message TEXT,
    temperature DECIMAL(3, 2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1024,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent_id)
);

-- 3. Agent Voice Configs
CREATE TABLE IF NOT EXISTS agent_voice_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    stt_provider VARCHAR(100) NOT NULL,
    tts_provider VARCHAR(100) NOT NULL,
    voice_provider VARCHAR(100) NOT NULL,
    voice_id VARCHAR(100) NOT NULL,
    voice_name VARCHAR(100),
    language VARCHAR(100),
    speech_speed DECIMAL(3, 2) DEFAULT 1.0,
    allow_interruption BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent_id)
);

-- 4. Agent Variables
CREATE TABLE IF NOT EXISTS agent_variables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    label VARCHAR(255),
    type VARCHAR(50) DEFAULT 'string',
    source VARCHAR(50) DEFAULT 'contact',
    default_value TEXT,
    required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent_id, key)
);

-- 5. Knowledge Documents
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT,
    storage_url TEXT NOT NULL,
    processing_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Knowledge Chunks
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    -- Assuming we are just storing standard text metadata for now. 
    -- Vector embedding (pgvector) setup can be added here later if enabled.
    -- embedding vector(1536),
    chunk_index INTEGER NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
