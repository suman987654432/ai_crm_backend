import { sql } from '../../config/database.js';

// Hardcoded Mock Organization ID for now (until Auth is set up)
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

export const createAgent = async (agentData) => {
  const { name, description, category, language, primary_goal, ai_config, voice_config } = agentData;

  // Ideally, use a transaction here. Neon serverless supports transactions if passed as multiple statements 
  // or via a standard pg pool, but for simple raw SQL we can do it sequentially or batch it.
  
  // 1. Create Agent
  const [newAgent] = await sql`
    INSERT INTO agents (organization_id, name, description, category, language, primary_goal, status)
    VALUES (${DEFAULT_ORG_ID}, ${name}, ${description}, ${category}, ${language}, ${primary_goal}, 'draft')
    RETURNING *;
  `;

  // 2. Create AI Config (if provided)
  let aiConfig = null;
  if (ai_config) {
    [aiConfig] = await sql`
      INSERT INTO agent_ai_configs (agent_id, llm_provider, llm_model, system_prompt, greeting_message)
      VALUES (${newAgent.id}, ${ai_config.llm_provider || 'gemini'}, ${ai_config.llm_model || 'gemini-flash'}, ${ai_config.system_prompt || ''}, ${ai_config.greeting_message || ''})
      RETURNING *;
    `;
  }

  // 3. Create Voice Config (if provided)
  let voiceConfig = null;
  if (voice_config) {
    [voiceConfig] = await sql`
      INSERT INTO agent_voice_configs (agent_id, stt_provider, tts_provider, voice_provider, voice_id, voice_name, language)
      VALUES (${newAgent.id}, ${voice_config.stt_provider || 'sarvam'}, ${voice_config.tts_provider || 'sarvam'}, ${voice_config.voice_provider || 'sarvam'}, ${voice_config.voice_id || 'priya'}, ${voice_config.voice_name || 'Priya'}, ${language})
      RETURNING *;
    `;
  }

  return { ...newAgent, ai_config: aiConfig, voice_config: voiceConfig };
};

export const getAllAgents = async (orgId = DEFAULT_ORG_ID) => {
  return await sql`
    SELECT a.*, v.voice_name 
    FROM agents a
    LEFT JOIN agent_voice_configs v ON a.id = v.agent_id
    WHERE a.organization_id = ${orgId}
    ORDER BY a.created_at DESC;
  `;
};

export const getAgentById = async (id, orgId = DEFAULT_ORG_ID) => {
  const [agent] = await sql`SELECT * FROM agents WHERE id = ${id} AND organization_id = ${orgId}`;
  if (!agent) return null;

  const [aiConfig] = await sql`SELECT * FROM agent_ai_configs WHERE agent_id = ${id}`;
  const [voiceConfig] = await sql`SELECT * FROM agent_voice_configs WHERE agent_id = ${id}`;
  const variables = await sql`SELECT * FROM agent_variables WHERE agent_id = ${id}`;

  return {
    ...agent,
    ai_config: aiConfig || null,
    voice_config: voiceConfig || null,
    variables
  };
};

export const deployAgent = async (id, orgId = DEFAULT_ORG_ID) => {
  const [updated] = await sql`
    UPDATE agents 
    SET status = 'active', updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id} AND organization_id = ${orgId}
    RETURNING *;
  `;
  return updated;
};

export const updateAgent = async (id, agentData, orgId = DEFAULT_ORG_ID) => {
  const { name, category, primary_goal, language, ai_config, voice_config } = agentData;
  
  // 1. Update Core Agent
  const [updated] = await sql`
    UPDATE agents 
    SET 
      name = COALESCE(${name}, name),
      category = COALESCE(${category}, category),
      primary_goal = COALESCE(${primary_goal}, primary_goal),
      language = COALESCE(${language}, language),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id} AND organization_id = ${orgId}
    RETURNING *;
  `;

  if (!updated) return null;

  // 2. Upsert AI Config
  let aiConfig = null;
  if (ai_config) {
    [aiConfig] = await sql`
      INSERT INTO agent_ai_configs (agent_id, llm_provider, llm_model, system_prompt, greeting_message)
      VALUES (${id}, ${ai_config.llm_provider || 'gemini'}, ${ai_config.llm_model || 'gemini-flash'}, ${ai_config.system_prompt || ''}, ${ai_config.greeting_message || ''})
      ON CONFLICT (agent_id) 
      DO UPDATE SET
        llm_provider = EXCLUDED.llm_provider,
        llm_model = EXCLUDED.llm_model,
        system_prompt = EXCLUDED.system_prompt,
        greeting_message = EXCLUDED.greeting_message,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
  }

  // 3. Upsert Voice Config
  let voiceConfig = null;
  if (voice_config) {
    [voiceConfig] = await sql`
      INSERT INTO agent_voice_configs (agent_id, stt_provider, tts_provider, voice_provider, voice_id, voice_name, language)
      VALUES (${id}, ${voice_config.stt_provider || 'sarvam'}, ${voice_config.tts_provider || 'sarvam'}, ${voice_config.voice_provider || 'sarvam'}, ${voice_config.voice_id || 'priya'}, ${voice_config.voice_name || 'Priya'}, COALESCE(${language}, 'hi-IN'))
      ON CONFLICT (agent_id)
      DO UPDATE SET
        stt_provider = EXCLUDED.stt_provider,
        tts_provider = EXCLUDED.tts_provider,
        voice_provider = EXCLUDED.voice_provider,
        voice_id = EXCLUDED.voice_id,
        voice_name = EXCLUDED.voice_name,
        language = EXCLUDED.language,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
  }

  return { ...updated, ai_config: aiConfig, voice_config: voiceConfig };
};

export const deleteAgent = async (id, orgId = DEFAULT_ORG_ID) => {
  const [deleted] = await sql`
    DELETE FROM agents 
    WHERE id = ${id} AND organization_id = ${orgId}
    RETURNING *;
  `;
  return deleted;
};
