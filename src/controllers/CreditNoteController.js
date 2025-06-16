import db from '../models/index.js';
const CreditNote = db.CreditNote;

// Create a new credit note
export const createCreditNote = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      print_credit_note: !!req.body.print_credit_note, // ensure boolean
    };
    const data = await CreditNote.create(payload);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create credit note', details: error.message });
  }
};


// Get all credit notes
export const getAllCreditNotes = async (req, res) => {
  try {
    const notes = await CreditNote.findAll();
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
    const note = await CreditNote.findByPk(req.params.id);
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

  try {
    const payload = {
      ...req.body,
      print_credit_note:
        req.body.print_credit_note === true ||
        req.body.print_credit_note === 'YES' ||
        req.body.print_credit_note === 'true' ||
        req.body.print_credit_note === 1,
    };

    const updated = await CreditNote.update(payload, { where: { id } });

    if (updated[0] === 0) {
      return res.status(404).json({ message: 'Credit note not found or no changes made.' });
    }

    return res.status(200).json({ message: 'Credit note updated successfully.' });
  } catch (error) {
    console.error('Error updating credit note:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};


// Delete a credit note
export const deleteCreditNote = async (req, res) => {
  try {
    const deleted = await CreditNote.destroy({
      where: { id: req.params.id },
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Credit note not found' });
    }

    res.status(200).json({ message: 'Credit note deleted successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete credit note',
      details: error.message,
    });
  }
};
