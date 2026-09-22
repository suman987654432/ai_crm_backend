import * as agentService from '../services/agent/agentService.js';

export const createAgent = async (req, res, next) => {
  try {
    const agent = await agentService.createAgent(req.body);
    res.status(201).json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
};

export const getAllAgents = async (req, res, next) => {
  try {
    const agents = await agentService.getAllAgents();
    res.status(200).json({ success: true, data: agents });
  } catch (error) {
    next(error);
  }
};

export const getAgentById = async (req, res, next) => {
  try {
    const agent = await agentService.getAgentById(req.params.id);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    res.status(200).json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
};

export const updateAgent = async (req, res, next) => {
  try {
    const updatedAgent = await agentService.updateAgent(req.params.id, req.body);
    if (!updatedAgent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    res.status(200).json({ success: true, data: updatedAgent });
  } catch (error) {
    next(error);
  }
};

export const deleteAgent = async (req, res, next) => {
  try {
    const deletedAgent = await agentService.deleteAgent(req.params.id);
    if (!deletedAgent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    res.status(200).json({ success: true, data: { message: 'Agent deleted successfully' } });
  } catch (error) {
    next(error);
  }
};

export const deployAgent = async (req, res, next) => {
  try {
    const agent = await agentService.deployAgent(req.params.id);
    res.status(200).json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
};