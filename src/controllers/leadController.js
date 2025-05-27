import db from "../models/index.js";
const {
    Lead,
    Product,
    Contact
} = db;

// Create a new Lead
export const createLead = async (req, res) => {
    try {
        const {
            lead_id,
            lead_title,
            transaction_type,
            lead_source,
            source_of_enquiry,
            rental_duration_months,
            rental_start_date,
            rental_end_date,
            lead_date,
            owner,
            remarks,
            lead_generated_by,
            is_active,
            contact_id,
            product_ids
        } = req.body;

        const newLead = await Lead.create({
            lead_id,
            lead_title,
            transaction_type,
            lead_source,
            source_of_enquiry,
            rental_duration_months,
            rental_start_date,
            rental_end_date,
            lead_date,
            owner,
            remarks,
            lead_generated_by,
            is_active,
            contact_id
        });

        // Associate selected products with lead
        if (product_ids && product_ids.length > 0) {
            await newLead.setProducts(product_ids);
        }

        res.status(201).json({
            message: "Lead created successfully",
            lead: newLead
        });
    } catch (error) {
        console.error("Error creating lead:", error);
        res.status(500).json({
            message: "Error creating lead",
            error
        });
    }
};

// Get all Leads
export const getAllLeads = async (req, res) => {
    try {
        const leads = await Lead.findAll({
            include: [{
                    model: Contact,
                    as: 'contact'
                },
                {
                    model: Product,
                    as: 'products'
                }
            ]
        });
        res.status(200).json(leads);
    } catch (error) {
        console.error("Error fetching leads:", error);
        res.status(500).json({
            message: "Error fetching leads",
            error
        });
    }
};

// Get a single Lead by ID
export const getLeadById = async (req, res) => {
    try {
        const lead = await Lead.findByPk(req.params.id, {
            include: [{
                    model: Contact,
                    as: 'contact'
                },
                {
                    model: Product,
                    as: 'products'
                }
            ]
        });

        if (!lead) {
            return res.status(404).json({
                message: "Lead not found"
            });
        }

        res.status(200).json(lead);
    } catch (error) {
        console.error("Error fetching lead:", error);
        res.status(500).json({
            message: "Error fetching lead",
            error
        });
    }
};

// Update a Lead
export const updateLead = async (req, res) => {
    try {
        const lead = await Lead.findByPk(req.params.id);
        if (!lead) {
            return res.status(404).json({
                message: "Lead not found"
            });
        }

        const {
            lead_id,
            lead_title,
            transaction_type,
            lead_source,
            source_of_enquiry,
            rental_duration_months,
            rental_start_date,
            rental_end_date,
            lead_date,
            owner,
            remarks,
            lead_generated_by,
            is_active,
            contact_id,
            product_ids
        } = req.body;

        await lead.update({
            lead_id,
            lead_title,
            transaction_type,
            lead_source,
            source_of_enquiry,
            rental_duration_months,
            rental_start_date,
            rental_end_date,
            lead_date,
            owner,
            remarks,
            lead_generated_by,
            is_active,
            contact_id
        });

        // Update product associations
        if (product_ids && Array.isArray(product_ids)) {
            await lead.setProducts(product_ids);
        }

        res.status(200).json({
            message: "Lead updated successfully",
            lead
        });
    } catch (error) {
        console.error("Error updating lead:", error);
        res.status(500).json({
            message: "Error updating lead",
            error
        });
    }
};

// Delete a Lead
export const deleteLead = async (req, res) => {
    try {
        const lead = await Lead.findByPk(req.params.id);
        if (!lead) {
            return res.status(404).json({
                message: "Lead not found"
            });
        }

        await lead.destroy();
        res.status(200).json({
            message: "Lead deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting lead:", error);
        res.status(500).json({
            message: "Error deleting lead",
            error
        });
    }
};