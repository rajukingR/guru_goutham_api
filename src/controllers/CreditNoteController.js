import db from '../models/index.js';
const CreditNote = db.CreditNote;
const CreditNoteItem = db.CreditNoteItem;
const InvoiceItem = db.InvoiceItem;
const Contact = db.Contact;
const ProductTemplete = db.ProductTemplete;

export const createCreditNote = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const {
      items,
      returned_date,
      rental_end_date,
      credit_note_number,
      credit_note_title,
      industry,
      transaction_type,
      payment_type,
      dc_id,
      dispatch_order_id,
      dc_number,
      dc_date,
      customer_id,
      customer_name,
      email,
      shipping_name,
      pincode,
      pan,
      tin,
      amount,
      reference,
      created_by,
      status,
      print_credit_note
    } = req.body;

    const creditNote = await CreditNote.create({
      credit_note_number,
      credit_note_title,
      industry,
      transaction_type,
      payment_type,
      dispatch_order_number: dc_number,
      dispatch_order_id,
      dc_date,
      customer_id,
      customer_name,
      email,
      shipping_name,
      pincode,
      pan,
      tin,
      amount,
      reference,
      returned_date,
      rental_end_date,
      created_by,
      status,
      print_credit_note: !!print_credit_note
    }, { transaction: t });

    if (items && items.length > 0) {
      const formattedItems = items.map(item => ({
        ...item,
        credit_note_id: creditNote.id
      }));

      await CreditNoteItem.bulkCreate(formattedItems, { transaction: t });

      // Removed InvoiceItem update logic
    }

    await t.commit();

    res.status(201).json({
      message: 'Credit note created successfully',
      creditNoteId: creditNote.id
    });
  } catch (error) {
    await t.rollback();
    console.error('Error creating credit note:', error);
    res.status(500).json({
      error: 'Failed to create credit note',
      details: error.message
    });
  }
};




// Get all credit notes in descending order
export const getAllCreditNotes = async (req, res) => {
  try {
    const notes = await CreditNote.findAll({
      include: [{ model: CreditNoteItem, as: 'items' }],
      order: [['createdAt', 'DESC']] // or use 'id' if preferred
    });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch credit notes',
      details: error.message,
    });
  }
};



// Get a single credit note by ID 
export const getCreditNoteById = async (req, res) => {
  try {
    const note = await CreditNote.findByPk(req.params.id, {
      include: [
        {
          model: CreditNoteItem,
          as: 'items',
          include: [
            {
              model: ProductTemplete,
              as: 'product' // This assumes you’ve aliased it properly in your associations
            }
          ]
        },
        {
          model: Contact,
          as: 'customer'
        }
      ]
    });

    if (!note) {
      return res.status(404).json({ error: 'Credit note not found' });
    }

    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch credit note',
      details: error.message,
    });
  }
};




// Update a credit note
// ✅ Corrected version: use ES module export
export const updateCreditNote = async (req, res) => {
  const { id } = req.params;
  const t = await db.sequelize.transaction();

  try {
    const {
      items,
      returned_date,
            rental_end_date,

      credit_note_number,
      credit_note_title,
      industry,
      transaction_type,
      payment_type,
      dc_id,
      dc_number,
      dc_date,
      customer_id,
      customer_name,
      email,
      shipping_name,
      pincode,
      pan,
      tin,
      amount,
      reference,
      created_by,
      status,
      print_credit_note
    } = req.body;

    const creditNote = await CreditNote.findByPk(id);
    if (!creditNote) {
      return res.status(404).json({ message: 'Credit note not found.' });
    }

    // Step 1: Reset previously affected invoice items
    const existingItems = await CreditNoteItem.findAll({
      where: { credit_note_id: id },
      transaction: t
    });

    for (const oldItem of existingItems) {
      await InvoiceItem.update(
        {
          returned_device_ids: null,
          returned_date: null,
          return_quantity: 0
        },
        {
          where: {
            product_id: oldItem.product_id,
            // Optional: match on dc_id if applicable
          },
          transaction: t
        }
      );
    }

    // Step 2: Update the credit note
    await creditNote.update({
      credit_note_number,
      credit_note_title,
      industry,
      transaction_type,
      payment_type,
      dispatch_order_number:dc_number,
      dispatch_order_id:dc_id,
      dc_date,
      customer_id,
      customer_name,
      email,
      shipping_name,
      pincode,
      pan,
      tin,
      amount,
      reference,
      returned_date,
            rental_end_date,

      created_by,
      status,
      print_credit_note:
        print_credit_note === true ||
        print_credit_note === 'YES' ||
        print_credit_note === 'true' ||
        print_credit_note === 1
    }, { transaction: t });

    // Step 3: Remove existing items
    await CreditNoteItem.destroy({
      where: { credit_note_id: id },
      transaction: t
    });

    // Step 4: Add new items and update invoice
    if (items && items.length > 0) {
      const formattedItems = items.map(item => ({
        ...item,
        credit_note_id: id
      }));

      await CreditNoteItem.bulkCreate(formattedItems, { transaction: t });

      for (const item of items) {
        await InvoiceItem.update(
          {
            returned_device_ids: item.device_ids,
            returned_date,
            return_quantity: item.quantity
          },
          {
            where: {
              product_id: item.product_id,
              // Optional: match on dc_id if applicable
            },
            transaction: t
          }
        );
      }
    }

    await t.commit();

    res.status(200).json({ message: 'Credit note updated successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Error updating credit note:', error);
    res.status(500).json({
      message: 'Failed to update credit note',
      details: error.message
    });
  }
};




// Delete a credit note
export const deleteCreditNote = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { id } = req.params;

    const creditNote = await CreditNote.findByPk(id);
    if (!creditNote) {
      return res.status(404).json({ error: 'Credit note not found' });
    }

    // Fetch all credit note items
    const creditNoteItems = await CreditNoteItem.findAll({
      where: { credit_note_id: id },
      transaction: t
    });

    // Reset fields in InvoiceItem
   

    // Delete credit note items
    await CreditNoteItem.destroy({
      where: { credit_note_id: id },
      transaction: t
    });

    // Delete the credit note
    await creditNote.destroy({ transaction: t });

    await t.commit();

    res.status(200).json({ message: 'Credit note and related data deleted successfully' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      error: 'Failed to delete credit note',
      details: error.message,
    });
  }
};


