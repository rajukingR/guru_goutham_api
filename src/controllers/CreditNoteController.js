import db from '../models/index.js';
const CreditNote = db.CreditNote;
const CreditNoteItem = db.CreditNoteItem;
const InvoiceItem = db.InvoiceItem;

// Create a new credit note
export const createCreditNote = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { items, invoice_id, returned_date, ...noteData } = req.body;

    // Create credit note
    const creditNote = await CreditNote.create({
      ...noteData,
      invoice_id,
      returned_date,
      print_credit_note: !!noteData.print_credit_note
    }, { transaction: t });

    // Create items if present and update InvoiceItems
    if (items && items.length > 0) {
      const formattedItems = items.map(item => ({
        ...item,
        credit_note_id: creditNote.id
      }));
      
      await CreditNoteItem.bulkCreate(formattedItems, { transaction: t });

      // Update InvoiceItems with returned information
      for (const item of items) {
        await InvoiceItem.update(
          {
            returned_device_ids: item.device_ids,
            returned_date: returned_date,
            return_quantity: item.quantity
          },
          {
            where: {
              invoice_id: invoice_id,
              product_id: item.product_id
            },
            transaction: t
          }
        );
      }
    }

    await t.commit();

    res.status(201).json({ message: 'Credit note created successfully', creditNoteId: creditNote.id });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: 'Failed to create credit note', details: error.message });
  }
};


// Get all credit notes
export const getAllCreditNotes = async (req, res) => {
  try {
    const notes = await CreditNote.findAll({
      include: [{ model: CreditNoteItem, as: 'items' }]
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
      include: [{ model: CreditNoteItem, as: 'items' }]
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
    const { items, returned_date, ...noteData } = req.body;

    const creditNote = await CreditNote.findByPk(id);
    if (!creditNote) {
      return res.status(404).json({ message: 'Credit note not found.' });
    }

    // 🧹 Step 1: Fetch and reset all related InvoiceItems
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
            invoice_id: creditNote.invoice_id,
            product_id: oldItem.product_id
          },
          transaction: t
        }
      );
    }

    // 🧾 Step 2: Update the credit note itself
    await creditNote.update({
      ...noteData,
      returned_date, // update returned_date if needed
      print_credit_note:
        noteData.print_credit_note === true ||
        noteData.print_credit_note === 'YES' ||
        noteData.print_credit_note === 'true' ||
        noteData.print_credit_note === 1,
    }, { transaction: t });

    // 🔥 Step 3: Delete previous credit note items
    await CreditNoteItem.destroy({
      where: { credit_note_id: id },
      transaction: t
    });

    // 🆕 Step 4: Add new items and update InvoiceItems
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
            returned_date: returned_date,
            return_quantity: item.quantity
          },
          {
            where: {
              invoice_id: creditNote.invoice_id,
              product_id: item.product_id
            },
            transaction: t
          }
        );
      }
    }

    await t.commit();

    return res.status(200).json({ message: 'Credit note and items updated successfully.' });
  } catch (error) {
    await t.rollback();
    console.error('Error updating credit note:', error);
    return res.status(500).json({ message: 'Internal server error.', details: error.message });
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
    for (const item of creditNoteItems) {
      await InvoiceItem.update(
        {
          returned_device_ids: null,
          returned_date: null,
          return_quantity: 0
        },
        {
          where: {
            invoice_id: creditNote.invoice_id,
            product_id: item.product_id
          },
          transaction: t
        }
      );
    }

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


