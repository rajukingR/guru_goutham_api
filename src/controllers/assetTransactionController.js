// import db from "../models/index.js";

// const {
//   AssetTransaction,
//   CreditNote,
//   CreditNoteItem,
//   DeliveryChallan,
//   DeliveryChallanItem
// } = db;

// // ✅ Generate unique credit note number 
// const generateCreditNoteNumber = () => {
//   const prefix = "CN";
//   const timestamp = Date.now().toString(36).toUpperCase();
//   const random = Math.random().toString(36).substr(2, 5).toUpperCase();
//   return `${prefix}-${timestamp}-${random}`;
// };

// export const createAssetTransaction = async (req, res) => {
//   const transaction = await db.sequelize.transaction();
//   try {
//     const {
//       customer_id,
//       product_id,
//       parent_asset_id,
//       asset_id,
//       size,
//       action_date,
//       itemDetails,
//       price,
//       status
//     } = req.body;

//     const item_name = itemDetails?.name || null;
//     const specification = itemDetails?.specification || null;
//     const item_type = itemDetails?.type || null;

//     // Check for existing "Added" transaction
//     const existingTransaction = await AssetTransaction.findOne({
//       where: {
//         asset_id
//       }
//     });

//     if (existingTransaction) {
//       const creditNoteId = existingTransaction.credit_note_id;
//       await AssetTransaction.destroy({
//         where: {
//           id: existingTransaction.id
//         }
//       });
//       if (creditNoteId) {
//         await CreditNote.destroy({
//           where: {
//             id: creditNoteId
//           }
//         });
//       }
//       return res.status(200).json({
//         message: "Existing 'Added' transaction deleted, ready to create new",
//         deletedTransactionId: existingTransaction.id
//       });
//     }

//     // ✅ Create new transaction (without credit_note_id yet)
//     const newTransaction = await AssetTransaction.create({
//       customer_id,
//       product_id,
//       parent_asset_id,
//       asset_id,
//       size,
//       action_date,
//       item_name,
//       specification,
//       item_type,
//       price,
//       status
//     }, {
//       transaction
//     });

//     let creditNote = null;

//     // ✅ If status = "Removed", create Credit Note
//     if (status === "Removed") {
//       const deliveryChallanItem = await DeliveryChallanItem.findOne({
//         where: {
//           product_id,
//           device_ids: {
//             [db.Sequelize.Op.like]: `%${parent_asset_id}%`
//           }
//         }
//       }, {
//         transaction
//       });

//       if (!deliveryChallanItem) {
//         await transaction.rollback();
//         return res.status(404).json({
//           message: "Delivery challan item not found for this asset",
//           asset_id
//         });
//       }

//       const deliveryChallan = await DeliveryChallan.findOne({
//         where: {
//           id: deliveryChallanItem.challan_id
//         }
//       }, {
//         transaction
//       });

//       if (!deliveryChallan) {
//         await transaction.rollback();
//         return res.status(404).json({
//           message: "Delivery challan not found",
//           challan_id: deliveryChallanItem.challan_id
//         });
//       }

//       // Create Credit Note
//       creditNote = await CreditNote.create({
//         credit_note_number: generateCreditNoteNumber(),
//         credit_note_title: `Credit Note for Asset Removed - ${asset_id}`,
//         industry: deliveryChallan.industry || "",
//         transaction_type: "Asset Removed",
//         payment_type: deliveryChallan.payment_type,
//         dispatch_order_number: deliveryChallan.dispatch_order_number,
//         dispatch_order_id: deliveryChallan.dispatch_order_id,
//         dc_date: deliveryChallan.dc_date,
//         customer_id: deliveryChallan.customer_code,
//         customer_name: deliveryChallan.shipping_name,
//         email: deliveryChallan.email,
//         shipping_name: deliveryChallan.shipping_name,
//         pincode: deliveryChallan.pincode,
//         pan: deliveryChallan.pan_number,
//         tin: deliveryChallan.gst_number,
//         amount: deliveryChallanItem.total_price || deliveryChallanItem.unit_price,
//         reference: `AssetRemoved-${Date.now()}-${asset_id}`,
//         returned_date: action_date,
//         rental_end_date: action_date,
//         created_by: req.user?.id || "system",
//         status: "Generated",
//         print_credit_note: true,
//         collected_person_name: deliveryChallan.delivery_person_name,
//         collected_person_no: deliveryChallan.delivery_person_phone_number,
//         vehicle_no: deliveryChallan.vehicle_number
//       }, {
//         transaction
//       });

//       // Create Credit Note Item
//       await CreditNoteItem.create({
//         credit_note_id: creditNote.id,
//         product_id: deliveryChallanItem.product_id,
//         product_name: deliveryChallanItem.product_name,
//         quantity: 1,
//         unit_price: price,
//         total_price: price,
//         device_ids: [asset_id],
//         reason: "Asset was removed"
//       }, {
//         transaction
//       });

//       // ✅ Update Asset Transaction with credit_note_id
//       await newTransaction.update({
//         credit_note_id: creditNote.id
//       }, {
//         transaction
//       });
//     }

//     await transaction.commit();

//     res.status(201).json({
//       message: "Asset transaction created successfully",
//       transaction: newTransaction,
//       creditNoteCreated: status === "Removed" ? true : false
//     });
//   } catch (error) {
//     await transaction.rollback();
//     console.error("Error creating asset transaction:", error);
//     res.status(500).json({
//       message: "Error creating asset transaction",
//       error
//     });
//   }
// };




import db from "../models/index.js";

const {
  AssetTransaction,
  CreditNote,
  CreditNoteItem,
  DeliveryChallan,
  DeliveryChallanItem
} = db;

// ✅ Generate unique credit note number
const generateCreditNoteNumber = () => {
  const prefix = "CN";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const createAssetTransaction = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const {
      customer_id,
      product_id,
      parent_asset_id,
      asset_id,
      size,
      action_date,
      itemDetails,
      price,
      status,
    } = req.body;

    const item_name = itemDetails?.name || null;
    const specification = itemDetails?.specification || null;
    const item_type = itemDetails?.type || null;
    const is_default = itemDetails?.isDefault || null; // 👈 map payload key to DB column

    let targetTransaction = null;
    let creditNote = null;

    // ✅ Always CREATE a new AssetTransaction record (no update logic)
    targetTransaction = await AssetTransaction.create(
      {
        customer_id,
        product_id,
        parent_asset_id,
        asset_id,
        size,
        action_date,
        item_name,
        specification,
        item_type,
        price,
        status,
        is_default,
      },
      { transaction }
    );

    // ✅ Each time "Removed" → Create a NEW Credit Note
    if (status === "Removed") {
      const deliveryChallanItem = await DeliveryChallanItem.findOne({
        where: {
          product_id,
          device_ids: {
            [db.Sequelize.Op.like]: `%${parent_asset_id}%`,
          },
        },
      });

      if (!deliveryChallanItem) {
        await transaction.rollback();
        return res.status(404).json({
          message: "Delivery challan item not found for this asset",
          asset_id,
        });
      }

      const deliveryChallan = await DeliveryChallan.findOne({
        where: { id: deliveryChallanItem.challan_id },
      });

      if (!deliveryChallan) {
        await transaction.rollback();
        return res.status(404).json({
          message: "Delivery challan not found",
          challan_id: deliveryChallanItem.challan_id,
        });
      }

      // ✅ Always create a new Credit Note (no checking for existing)
      creditNote = await CreditNote.create(
        {
          credit_note_number: generateCreditNoteNumber(),
          credit_note_title: `Credit Note for Asset Removed - ${asset_id}`,
          industry: deliveryChallan.industry || "",
          transaction_type: "Asset Removed",
          payment_type: deliveryChallan.payment_type,
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
            deliveryChallanItem.total_price ||
            deliveryChallanItem.unit_price,
          reference: `AssetRemoved-${Date.now()}-${asset_id}`,
          returned_date: action_date,
          rental_end_date: action_date,
          created_by: req.user?.id || "system",
          status: "Generated",
          print_credit_note: true,
          collected_person_name: deliveryChallan.delivery_person_name,
          collected_person_no:
            deliveryChallan.delivery_person_phone_number,
          vehicle_no: deliveryChallan.vehicle_number,
        },
        { transaction }
      );

      // ✅ Always create a new CreditNoteItem
      await CreditNoteItem.create(
        {
          credit_note_id: creditNote.id,
          product_id: deliveryChallanItem.product_id,
          product_name: deliveryChallanItem.product_name,
          quantity: 1,
          unit_price: price,
          total_price: price,
          device_ids: [asset_id],
          reason: "Asset was removed again",
        },
        { transaction }
      );

      // ✅ Link this new credit note to this specific asset transaction
      await targetTransaction.update(
        { credit_note_id: creditNote.id },
        { transaction }
      );
    }

    await transaction.commit();
    res.status(201).json({
      message: "Asset transaction created successfully",
      transaction: targetTransaction,
      creditNote: creditNote || null,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating asset transaction:", error);
    res.status(500).json({
      message: "Error creating asset transaction",
      error,
    });
  }
};





// ✅ Get all transactions
export const getAssetTransactions = async (req, res) => {
  try {
    const transactions = await AssetTransaction.findAll({
      order: [
        ["created_at", "DESC"]
      ]
    });

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching asset transactions:", error);
    res.status(500).json({
      message: "Error fetching asset transactions",
      error
    });
  }
};

// ✅ Get single transaction by ID
export const getAssetTransactionById = async (req, res) => {
  try {
    const {
      id
    } = req.params;

    const transaction = await AssetTransaction.findByPk(id);

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found"
      });
    }

    res.status(200).json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({
      message: "Error fetching transaction",
      error
    });
  }
};

// ✅ Update transaction
export const updateAssetTransaction = async (req, res) => {
  try {
    const {
      id
    } = req.params;

    const [updated] = await AssetTransaction.update(req.body, {
      where: {
        id
      }
    });

    if (!updated) {
      return res.status(404).json({
        message: "Transaction not found"
      });
    }

    const updatedTransaction = await AssetTransaction.findByPk(id);
    res.status(200).json({
      message: "Transaction updated successfully",
      transaction: updatedTransaction
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({
      message: "Error updating transaction",
      error
    });
  }
};

export const deleteAssetTransaction = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const {
      id
    } = req.params;

    // Find the transaction
    const assetTxn = await AssetTransaction.findOne({
      where: {
        id
      },
      transaction
    });

    if (!assetTxn) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Transaction not found"
      });
    }

    // If a related Credit Note exists, delete its items and the note itself
    if (assetTxn.credit_note_id) {
      await CreditNoteItem.destroy({
        where: {
          credit_note_id: assetTxn.credit_note_id
        },
        transaction
      });

      await CreditNote.destroy({
        where: {
          id: assetTxn.credit_note_id
        },
        transaction
      });
    }

    // Delete the Asset Transaction
    await AssetTransaction.destroy({
      where: {
        id
      },
      transaction
    });

    await transaction.commit();

    res.status(200).json({
      message: "Transaction and related credit note (if any) deleted successfully"
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting transaction:", error);
    res.status(500).json({
      message: "Error deleting transaction",
      error
    });
  }
};