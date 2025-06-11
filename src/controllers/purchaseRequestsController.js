import db from '../models/index.js';

const PurchaseRequest = db.PurchaseRequest;
const Supplier = db.Supplier;
const PurchaseRequestItem = db.PurchaseRequestItem;
const ProductTemplete = db.ProductTemplete;

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

    if (!purchase_request_id || !purchase_request_date || !purchase_type || !purchase_request_status || !owner || !supplier_id) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const purchaseRequest = await PurchaseRequest.create({
      purchase_request_id,
      purchase_request_date,
      purchase_type,
      purchase_request_status,
      owner,
      supplier_id,
      description,
      selected_products,
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
        },
        {
          model: PurchaseRequestItem,
          as: 'items',
          include: [
            {
              model: ProductTemplete,
              as: 'product',
              attributes: ['product_name', 'purchase_price']
            }
          ]
        }
      ]
    });

    const formatted = purchaseRequests.map(request => {
      const requestJSON = request.toJSON();
      let totalValue = 0;

      const itemsWithValue = (requestJSON.items || []).map(item => {
        const qty = item.quantity || 0;
        const price = item.product?.purchase_price || 0;
        const itemTotal = qty * price;
        totalValue += itemTotal;

        return {
          ...item,
          item_total_value: itemTotal
        };
      });

      return {
        ...requestJSON,
        total_order_value: totalValue,
        items: itemsWithValue
      };
    });

    res.status(200).json(formatted);
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
        },
        {
          model: PurchaseRequestItem,
          as: 'items',
          include: [
            {
              model: ProductTemplete,
              as: 'product',
              attributes: ['product_name', 'purchase_price']
            }
          ]
        }
      ]
    });

    const formatted = purchaseRequests.map(request => {
      const requestJSON = request.toJSON();
      let totalValue = 0;

      const itemsWithValue = (requestJSON.items || []).map(item => {
        const qty = item.quantity || 0;
        const price = item.product?.purchase_price || 0;
        const itemTotal = qty * price;
        totalValue += itemTotal;

        return {
          ...item,
          item_total_value: itemTotal
        };
      });

      return {
        ...requestJSON,
        total_order_value: totalValue,
        items: itemsWithValue
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching approved purchase requests', error });
  }
};

export const getPurchaseRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseRequest = await PurchaseRequest.findByPk(id, {
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['supplier_name']
        },
        {
          model: PurchaseRequestItem,
          as: 'items',
          include: [
            {
              model: ProductTemplete,
              as: 'product',
              attributes: ['product_name', 'purchase_price']
            }
          ]
        }
      ]
    });

    if (!purchaseRequest) {
      return res.status(404).json({ message: 'Purchase request not found' });
    }

    const requestJSON = purchaseRequest.toJSON();
    let totalValue = 0;

    const itemsWithValue = (requestJSON.items || []).map(item => {
      const qty = item.quantity || 0;
      const price = item.product?.purchase_price || 0;
      const itemTotal = qty * price;
      totalValue += itemTotal;

      return {
        ...item,
        item_total_value: itemTotal
      };
    });

    const response = {
      ...requestJSON,
      total_order_value: totalValue,
      items: itemsWithValue
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching purchase request', error });
  }
};

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


export const deletePurchaseRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseRequest = await PurchaseRequest.findByPk(id, {
      include: [
        {
          model: PurchaseRequestItem,
          as: 'items'
        }
      ]
    });

    if (!purchaseRequest) {
      return res.status(404).json({ message: 'Purchase request not found' });
    }

    // Delete associated items
    if (purchaseRequest.items && purchaseRequest.items.length > 0) {
      await Promise.all(
        purchaseRequest.items.map(item => item.destroy())
      );
    }

    // Delete the purchase request itself
    await purchaseRequest.destroy();

    res.status(200).json({ message: 'Purchase request deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase request:', error);
    res.status(500).json({ message: 'Error deleting purchase request', error });
  }
};

