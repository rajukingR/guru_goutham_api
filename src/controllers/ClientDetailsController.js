// controllers/ClientDetailsController.js

import db from '../models/index.js';
const ClientDetails = db.ClientDetails;

// Create a new client
export const createClient = async (req, res) => {
  try {
    const client = await ClientDetails.create(req.body);
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: 'Error creating client', error });
  }
};

// Get all clients
export const getAllClients = async (req, res) => {
  try {
    const clients = await ClientDetails.findAll();
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clients', error });
  }
};

// Get a single client by ID
export const getClientById = async (req, res) => {
  try {
    const client = await ClientDetails.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching client', error });
  }
};

// Update a client
export const updateClient = async (req, res) => {
  try {
    const client = await ClientDetails.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    await client.update(req.body);
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ message: 'Error updating client', error });
  }
};

// Delete a client
export const deleteClient = async (req, res) => {
  try {
    const client = await ClientDetails.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    await client.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting client', error });
  }
};
