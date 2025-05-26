import db from '../models/index.js';

const Supplier = db.Supplier;
const SupplierAddress = db.SupplierAddress;
const BankDetail = db.BankDetail;
const SupplierContact = db.SupplierContact;

// Create supplier with address, bank, and contacts
export const createSupplier = async (req, res) => {
  try {
    const {
      supplier_code,
      registration_date,
      supplier_name,
      supplier_owner,
      gst_number,
      introduced_by,
      description,
      address,
      bank,
      contacts
    } = req.body;

    const supplier = await Supplier.create({
      supplier_code,
      registration_date,
      supplier_name,
      supplier_owner,
      gst_number,
      introduced_by,
      description,
      address: address,
      bank: bank,
      contacts: contacts
    }, {
      include: [
        { model: SupplierAddress, as: 'address' },
        { model: BankDetail, as: 'bank' },
        { model: SupplierContact, as: 'contacts' }
      ]
    });

    res.status(201).json({ message: 'Supplier created successfully', supplier });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating supplier', error });
  }
};

// Get all suppliers with their details
export const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({
      include: [
        { model: SupplierAddress, as: 'address' },
        { model: BankDetail, as: 'bank' },
        { model: SupplierContact, as: 'contacts' }
      ]
    });

    res.status(200).json(suppliers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching suppliers', error });
  }
};

// Get single supplier by ID
export const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findByPk(id, {
      include: [
        { model: SupplierAddress, as: 'address' },
        { model: BankDetail, as: 'bank' },
        { model: SupplierContact, as: 'contacts' }
      ]
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.status(200).json(supplier);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching supplier', error });
  }
};

// Update supplier by ID
export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findByPk(id, {
      include: [
        { model: SupplierAddress, as: 'address' },
        { model: BankDetail, as: 'bank' },
        { model: SupplierContact, as: 'contacts' }
      ]
    });

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const {
      supplier_code,
      registration_date,
      supplier_name,
      supplier_owner,
      gst_number,
      introduced_by,
      description,
      address,
      bank,
      contacts
    } = req.body;

    await supplier.update({
      supplier_code,
      registration_date,
      supplier_name,
      supplier_owner,
      gst_number,
      introduced_by,
      description
    });

    // Update or create address
    if (address) {
      if (supplier.address) {
        await supplier.address.update(address);
      } else {
        await SupplierAddress.create({ ...address, supplier_id: supplier.supplier_id });
      }
    }

    // Update or create bank
    if (bank) {
      if (supplier.bank) {
        await supplier.bank.update(bank);
      } else {
        await BankDetail.create({ ...bank, supplier_id: supplier.supplier_id });
      }
    }

    // Delete old contacts and create new ones
    if (contacts) {
      await SupplierContact.destroy({ where: { supplier_id: supplier.supplier_id } });
      const newContacts = contacts.map(c => ({ ...c, supplier_id: supplier.supplier_id }));
      await SupplierContact.bulkCreate(newContacts);
    }

    res.status(200).json({ message: 'Supplier updated successfully', supplier });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating supplier', error });
  }
};

// Delete supplier
export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    await SupplierAddress.destroy({ where: { supplier_id: id } });
    await BankDetail.destroy({ where: { supplier_id: id } });
    await SupplierContact.destroy({ where: { supplier_id: id } });
    await supplier.destroy();

    res.status(200).json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting supplier', error });
  }
};
