import db from '../models/index.js';

const CreditNote = db.CreditNote;
const CreditNoteItem = db.CreditNoteItem;
const AssetSwap = db.AssetSwap;
const DeliveryChallan = db.DeliveryChallan;
const DeliveryChallanItem = db.DeliveryChallanItem;

// ✅ Generate unique credit note number
const generateCreditNoteNumber = () => {
  const prefix = 'CN';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// ✅ Create Asset Swap (with optional Credit Note if client asset)
export const createAssetSwap = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      product_id,
      asset_id,
      product_name,
      purchase_price,
      rent_price_per_month,
      show_client_assets,
      show_warehouse_assets,
      reason,
      swapped_on
    } = req.body;

    let assetSwap = null;
    let creditNote = null;

    // 🚨 CASE 1: Warehouse asset → ONLY AssetSwap
    if (show_warehouse_assets) {
      assetSwap = await AssetSwap.create(
        {
          product_id,
          asset_id,
          product_name,
          purchase_price,
          rent_price_per_month,
          show_client_assets,
          show_warehouse_assets,
          reason,
          swapped_on,
          credit_note_id: null
        },
        { transaction }
      );

    } else {
      // 🚨 CASE 2: Client asset → Full flow (Challan + Credit Note)
      const deliveryChallanItem = await DeliveryChallanItem.findOne(
        {
          where: {
            product_id,
            device_ids: { [db.Sequelize.Op.like]: `%${asset_id}%` }
          }
        },
        { transaction }
      );

      if (!deliveryChallanItem) {
        await transaction.rollback();
        return res.status(404).json({
          message: "Delivery challan item not found for this asset",
          asset_id
        });
      }

      const deliveryChallan = await DeliveryChallan.findOne(
        { where: { id: deliveryChallanItem.challan_id } },
        { transaction }
      );

      if (!deliveryChallan) {
        await transaction.rollback();
        return res.status(404).json({
          message: "Delivery challan not found",
          challan_id: deliveryChallanItem.challan_id
        });
      }

      // ✅ Create Credit Note
      const creditNoteData = {
        credit_note_number: generateCreditNoteNumber(),
        credit_note_title: `Credit Note for Asset Swap - ${asset_id}`,
        industry: deliveryChallan.industry || "",
        transaction_type: "Asset Swap",
        payment_type: deliveryChallan.payment_type || "Prepaid",
        dispatch_order_number: deliveryChallan.dispatch_order_number,
        dispatch_order_id: deliveryChallan.dispatch_order_id,
        dc_date: deliveryChallan.dc_date,
        customer_id: deliveryChallan.customer_code,
        customer_name: deliveryChallan.shipping_name,
        email: deliveryChallan.email,
        shipping_name: deliveryChallan.shipping_name,
        pincode: deliveryChallan.pincode,
        pan: deliveryChallan.pan_number,
        tin: deliveryChallan.gst_number,
        amount:
          deliveryChallanItem.total_price || deliveryChallanItem.unit_price,
        reference: `AssetSwap-${Date.now()}-${asset_id}`,
        returned_date: swapped_on,
        rental_end_date: swapped_on,
        created_by: req.user?.id || "system",
        status: "Generated",
        print_credit_note: true,
        collected_person_name: deliveryChallan.delivery_person_name,
        collected_person_no: deliveryChallan.delivery_person_phone_number,
        vehicle_no: deliveryChallan.vehicle_number
      };

      creditNote = await CreditNote.create(creditNoteData, { transaction });

      // ✅ Create Asset Swap linked with Credit Note
      assetSwap = await AssetSwap.create(
        {
          product_id,
          asset_id,
          product_name,
          purchase_price,
          rent_price_per_month,
          show_client_assets,
          show_warehouse_assets,
          reason,
          swapped_on,
          credit_note_id: creditNote.id
        },
        { transaction }
      );

      // ✅ Update credit note reference with AssetSwap ID
      await creditNote.update(
        { reference: `AssetSwap-${assetSwap.id}-${asset_id}` },
        { transaction }
      );

      // ✅ Add Credit Note Item
      await CreditNoteItem.create(
        {
          credit_note_id: creditNote.id,
          product_id: deliveryChallanItem.product_id,
          product_name: deliveryChallanItem.product_name,
          quantity: 1,
          unit_price: deliveryChallanItem.unit_price,
          total_price: deliveryChallanItem.unit_price,
          device_ids: [asset_id],
          reason
        },
        { transaction }
      );
    }

    await transaction.commit();

    // ✅ Final Fetch
    const completeAssetSwap = await AssetSwap.findByPk(assetSwap.id);
    let completeCreditNote = null;
    if (creditNote) {
      completeCreditNote = await CreditNote.findByPk(creditNote.id, {
        include: [{ model: CreditNoteItem, as: "items" }]
      });
    }

    res.status(201).json({
      message: show_warehouse_assets
        ? "Asset swap created successfully (warehouse asset only)"
        : "Asset swap and credit note created successfully",
      assetSwap: completeAssetSwap,
      creditNote: completeCreditNote
    });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error creating asset swap:", error);
    res.status(500).json({
      message: "Error creating asset swap",
      error: error.message
    });
  }
};


// ✅ Get all Asset Swaps (FIXED - no incorrect associations)
export const getAssetSwaps = async (req, res) => {
  try {
    const assetSwaps = await AssetSwap.findAll({
      order: [
        ['id', 'DESC']
      ]
    });

    res.status(200).json({
      message: "Asset swaps retrieved successfully",
      assetSwaps
    });
  } catch (error) {
    console.error("❌ Error retrieving asset swaps:", error);
    res.status(500).json({
      message: "Error retrieving asset swaps",
      error: error.message,
    });
  }
};

// ✅ Get Asset Swap by ID with related Credit Note
export const getAssetSwapById = async (req, res) => {
  try {
    const assetSwap = await AssetSwap.findByPk(req.params.id);

    if (!assetSwap) {
      return res.status(404).json({
        message: 'Asset swap not found'
      });
    }

    // Find related credit note using a custom query
    const creditNote = await CreditNote.findOne({
      where: {
        reference: {
          [db.Sequelize.Op.like]: `%AssetSwap-${assetSwap.id}-%`
        }
      },
      include: [{
        model: CreditNoteItem,
        as: 'items'
      }]
    });

    const response = {
      ...assetSwap.toJSON(),
      credit_note: creditNote
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching asset swap',
      error,
    });
  }
};

// ✅ Get All Asset Swaps
export const getAllAssetSwaps = async (req, res) => {
  try {
    const assetSwaps = await AssetSwap.findAll({
      order: [
        ['id', 'DESC']
      ],
    });

    res.status(200).json(assetSwaps);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching asset swaps',
      error,
    });
  }
};

// ✅ Update Asset Swap
export const updateAssetSwap = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const assetSwap = await AssetSwap.findByPk(req.params.id, {
      transaction,
      include: [{
        model: CreditNote,
        as: 'credit_note',
        include: [{
          model: CreditNoteItem,
          as: 'items'
        }]
      }]
    });

    if (!assetSwap) {
      await transaction.rollback();
      return res.status(404).json({
        message: 'Asset swap not found'
      });
    }

    // Update the asset swap
    await assetSwap.update(req.body, { transaction });

    // If there's an associated credit note, update it too
    if (assetSwap.credit_note) {
      const creditNoteData = {
        returned_date: req.body.swapped_on || assetSwap.swapped_on,
        rental_end_date: req.body.swapped_on || assetSwap.swapped_on,
        // Add other fields you might want to update
      };
      
      await assetSwap.credit_note.update(creditNoteData, { transaction });

      // Update credit note items if needed
      if (req.body.reason && assetSwap.credit_note.items.length > 0) {
        const creditNoteItem = assetSwap.credit_note.items[0];
        await creditNoteItem.update({ reason: req.body.reason }, { transaction });
      }
    }

    await transaction.commit();

    // Fetch the updated asset swap with associations
    const updatedAssetSwap = await AssetSwap.findByPk(req.params.id, {
      include: [{
        model: CreditNote,
        as: 'credit_note',
        include: [{
          model: CreditNoteItem,
          as: 'items'
        }]
      }]
    });

    res.status(200).json({
      message: 'Asset swap updated successfully',
      assetSwap: updatedAssetSwap,
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({
      message: 'Error updating asset swap',
      error,
    });
  }
};

// ✅ Delete Asset Swap
export const deleteAssetSwap = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const assetSwap = await AssetSwap.findByPk(req.params.id, {
      transaction,
      include: [{
        model: CreditNote,
        as: 'credit_note'
      }]
    });

    if (!assetSwap) {
      await transaction.rollback();
      return res.status(404).json({
        message: 'Asset swap not found'
      });
    }

    // Delete associated credit note and its items if exists
    if (assetSwap.credit_note) {
      await CreditNoteItem.destroy({
        where: {
          credit_note_id: assetSwap.credit_note.id
        },
        transaction
      });

      await CreditNote.destroy({
        where: {
          id: assetSwap.credit_note.id
        },
        transaction
      });
    }

    // Delete the asset swap
    await assetSwap.destroy({
      transaction
    });

    await transaction.commit();

    res.status(200).json({
      message: 'Asset swap and associated credit note deleted successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({
      message: 'Error deleting asset swap',
      error,
    });
  }
};