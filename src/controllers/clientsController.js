import db from '../models/index.js';

const Client = db.Client;

// Create new client
export const createClient = async (req, res) => {
  try {
    const clientData = req.body;

    const existingClient = await Client.findOne({ where: { client_id: clientData.client_id } });
    if (existingClient) {
      return res.status(400).json({ message: 'Client ID already exists' });
    }

    const client = await Client.create(clientData);
    res.status(201).json({ message: 'Client created successfully', client });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating client', error });
  }
};

// Get all clients
export const getAllClients = async (req, res) => {
  try {
    const clients = await Client.findAll();
    res.status(200).json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching clients', error });
  }
};

// Get client by ID
export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findByPk(id);

    if (!client) return res.status(404).json({ message: 'Client not found' });

    res.status(200).json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching client', error });
  }
};

// Update client
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const clientData = req.body;

    const client = await Client.findByPk(id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Check for unique client_id if updating
    if (clientData.client_id && clientData.client_id !== client.client_id) {
      const existingClient = await Client.findOne({ where: { client_id: clientData.client_id } });
      if (existingClient) {
        return res.status(400).json({ message: 'Client ID already exists' });
      }
    }

    await client.update({
      ...clientData,
      updated_at: new Date(),
    });

    res.status(200).json({ message: 'Client updated successfully', client });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating client', error });
  }
};

// Delete client
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findByPk(id);

    if (!client) return res.status(404).json({ message: 'Client not found' });

    await client.destroy();
    res.status(200).json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting client', error });
  }
};
