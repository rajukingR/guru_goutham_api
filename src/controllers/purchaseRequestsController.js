import db from '../models/index.js';

const PurchaseRequest = db.PurchaseRequest;
const Supplier = db.Supplier;
const PurchaseQuotation = db.PurchaseQuotation;

export const createPurchaseRequest = async (req, res) => {
  try {
    const {
      purchase_request_id,
      purchase_request_date,
      purchase_type,
      purchase_request_status,
      owner,
      supplier_id,
      description,
      selected_products,
      created_at,
      updated_at
    } = req.body;

    // Validate required fields
    if (!purchase_request_id) {
      return res.status(400).json({ message: 'purchase_request_id is required' });
    }

    if (!purchase_request_date || !purchase_type || !purchase_request_status || !owner || !supplier_id) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Create the purchase request
    const purchaseRequest = await PurchaseRequest.create({
      purchase_request_id,
      purchase_request_date,
      purchase_type,
      purchase_request_status,
      owner,
      supplier_id,
      description,
      selected_products, // assuming it's a JSON/JSONB field in your Sequelize model
      created_at: created_at || new Date(),
      updated_at: updated_at || new Date()
    });

    res.status(201).json({
      message: 'Purchase request created successfully',
      purchaseRequest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating purchase request', error });
  }
};

export const getAllPurchaseRequests = async (req, res) => {
  try {
    const purchaseRequests = await PurchaseRequest.findAll({
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['supplier_name'] 
        }
      ]
    });

    res.status(200).json(purchaseRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching purchase requests', error });
  }
};


export const getApprovedPurchaseRequests = async (req, res) => {
  try {
    const purchaseRequests = await PurchaseRequest.findAll({
      where: {
        purchase_request_status: 'Approved'
      },
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['supplier_name']
        }
      ]
    });

    res.status(200).json(purchaseRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching approved purchase requests', error });
  }
};



// ✅ Get purchase request by ID
export const getPurchaseRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseRequest = await PurchaseRequest.findByPk(id);

    if (!purchaseRequest) {
      return res.status(404).json({ message: 'Purchase request not found' });
    }

    res.status(200).json(purchaseRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching purchase request', error });
  }
};

// ✅ Update purchase request
export const updatePurchaseRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      purchase_request_id,
      purchase_request_date,
      purchase_type,
      purchase_request_status,
      owner,
      supplier_id,
      description,
      selected_products,
      updated_at
    } = req.body;

    const purchaseRequest = await PurchaseRequest.findByPk(id);

    if (!purchaseRequest) {
      return res.status(404).json({ message: 'Purchase request not found' });
    }

    await purchaseRequest.update({
      purchase_request_id,
      purchase_request_date,
      purchase_type,
      purchase_request_status,
      owner,
      supplier_id,
      description,
      selected_products,
      updated_at: updated_at || new Date()
    });

    res.status(200).json({ message: 'Purchase request updated successfully', purchaseRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating purchase request', error });
  }
};

// ✅ Delete purchase request
export const deletePurchaseRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseRequest = await PurchaseRequest.findByPk(id);

    if (!purchaseRequest) {
      return res.status(404).json({ message: 'Purchase request not found' });
    }

    await purchaseRequest.destroy();
    res.status(200).json({ message: 'Purchase request deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting purchase request', error });
  }
};
