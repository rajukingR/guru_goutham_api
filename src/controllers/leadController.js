import db from "../models/index.js";
const {
  Lead,
  ProductTemplete,
  Contact,
  LeadProduct
} = db;
import { Op } from "sequelize";


export const createLead = async (req, res) => {
  try {
    const {
      lead_id,
      lead_title,
      transaction_type,
      payment_type,
      lead_source,
      source_of_enquiry,
      // rental_duration_months,
      // rental_duration_days,
      // rental_start_date,
      // rental_end_date,
      lead_date,
      owner,
      remarks,
      lead_generated_by,
      is_active,
      contact_id,
      selected_products
    } = req.body;

    const newLead = await Lead.create({
      lead_id,
      lead_title,
      transaction_type,
      payment_type,
      lead_source,
      source_of_enquiry,
      
      lead_date,
      owner,
      remarks,
      lead_generated_by,
      is_active,
      contact_id
    });

    if (Array.isArray(selected_products) && selected_products.length > 0) {
      const leadProductsData = selected_products.map((product) => ({
        lead_id: newLead.id,
        product_id: product.product_id,
        product_name: product.product_name,
        quantity: product.quantity
      }));

      await db.LeadProduct.bulkCreate(leadProductsData); // <- make sure `db.LeadProduct` is defined
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
      include: [
        {
          model: Contact,
          as: 'contact'
        },
        {
          model: LeadProduct,
          as: 'lead_products',
          include: [
            {
              model: ProductTemplete,
              as: 'product'
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']] // <-- Sort leads by created_at descending
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





// export const getAllLeads = async (req, res) => {
//   try {
//     const { role_name, id } = req.user;

//     let leads;

//     if (role_name === "Admin") {
//       // ⭐ Admin gets ALL leads
//       leads = await Lead.findAll({
//         include: [
//           {
//             model: Contact,
//             as: "contact",
//           },
//           {
//             model: LeadProduct,
//             as: "lead_products",
//             include: [
//               {
//                 model: ProductTemplete,
//                 as: "product",
//               },
//             ],
//           },
//         ],
//         order: [["created_at", "DESC"]],
//       });
//     } else {
//       // ⭐ Non-admin → get leads ONLY if contact.superior_id = logged in user
//       leads = await Lead.findAll({
//         include: [
//           {
//             model: Contact,
//             as: "contact",
//             required: true,
//             where: { superior_id: id }, // ⭐ important filter
//           },
//           {
//             model: LeadProduct,
//             as: "lead_products",
//             include: [
//               {
//                 model: ProductTemplete,
//                 as: "product",
//               },
//             ],
//           },
//         ],
//         order: [["created_at", "DESC"]],
//       });
//     }

//     res.status(200).json(leads);

//   } catch (error) {
//     console.error("Error fetching leads:", error);
//     res.status(500).json({
//       message: "Error fetching leads",
//       error: error.message,
//     });
//   }
// };


export const getAllLeadsActived = async (req, res) => {
  try {
    const leads = await Lead.findAll({
      where: { is_active: true },
      include: [
        {
          model: Contact,
          as: 'contact'
        },
        {
          model: LeadProduct,
          as: 'lead_products',
          include: [
            {
              model: ProductTemplete,
              as: 'product'
            }
          ]
        }
      ],
            order: [['id', 'DESC']] // <-- Sort leads by created_at descending

    });

    res.status(200).json(leads);
  } catch (error) {
    console.error("Error fetching active leads:", error);
    res.status(500).json({
      message: "Error fetching active leads",
      error
    });
  }
};





// export const getAllLeadsActived = async (req, res) => {
//   try {
//     const { role_name, id } = req.user;

//     let leads;

//     if (role_name === "Admin") {
//       // ⭐ Admin → Get ALL active leads
//       leads = await Lead.findAll({
//         where: { is_active: true },
//         include: [
//           {
//             model: Contact,
//             as: "contact",
//           },
//           {
//             model: LeadProduct,
//             as: "lead_products",
//             include: [
//               {
//                 model: ProductTemplete,
//                 as: "product",
//               },
//             ],
//           },
//         ],
//         order: [["id", "DESC"]],
//       });
//     } else {
//       // ⭐ Non-admin → Get only active leads they own via contact.superior_id
//       leads = await Lead.findAll({
//         where: { is_active: true },
//         include: [
//           {
//             model: Contact,
//             as: "contact",
//             required: true,
//             where: { superior_id: id },  // ⭐ Important filtering
//           },
//           {
//             model: LeadProduct,
//             as: "lead_products",
//             include: [
//               {
//                 model: ProductTemplete,
//                 as: "product",
//               },
//             ],
//           },
//         ],
//         order: [["id", "DESC"]],
//       });
//     }

//     res.status(200).json(leads);

//   } catch (error) {
//     console.error("Error fetching active leads:", error);
//     res.status(500).json({
//       message: "Error fetching active leads",
//       error: error.message,
//     });
//   }
// };


// Get a single Lead by ID
export const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findByPk(req.params.id, {
      include: [
        {
          model: Contact,
          as: 'contact'
        },
        {
          model: LeadProduct,
          as: 'lead_products',
          include: [
            {
              model: ProductTemplete,
              as: 'product'
            }
          ]
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
      return res.status(404).json({ message: "Lead not found" });
    }

    const {
      lead_id,
      lead_title,
      transaction_type,
      payment_type,
      lead_source,
      source_of_enquiry,
      rental_duration_months,
      rental_duration_days,
      rental_start_date,
      rental_end_date,
      lead_date,
      owner,
      remarks,
      lead_generated_by,
      is_active,
      contact_id,
      selected_products
    } = req.body;

    // Update the lead data
    await lead.update({
      lead_id,
      lead_title,
      transaction_type,
      payment_type,
      lead_source,
      source_of_enquiry,
      rental_duration_months,
      rental_duration_days,
      rental_start_date,
      rental_end_date,
      lead_date,
      owner,
      remarks,
      lead_generated_by,
      is_active,
      contact_id
    });

    // Update the lead_products table
    if (Array.isArray(selected_products) && selected_products.length > 0) {
      // First delete all existing products for this lead
      await db.LeadProduct.destroy({
        where: { lead_id: lead.id }
      });

      // Then add the new products
      const productIds = selected_products.map(p => p.product_id);

      // Validate all product_ids exist in ProductTemplete
      const validProducts = await ProductTemplete.findAll({
        where: { id: productIds },
        attributes: ['id']
      });

      const validIds = validProducts.map(p => p.id);

      const validLeadProductsData = selected_products
        .filter(p => validIds.includes(p.product_id))
        .map((product) => ({
          lead_id: lead.id,  // Use existing lead.id instead of newLead.id
          product_id: product.product_id,
          product_name: product.product_name,
          quantity: product.quantity
        }));

      if (validLeadProductsData.length > 0) {
        await db.LeadProduct.bulkCreate(validLeadProductsData);
      }
    }

    res.status(200).json({
      message: "Lead updated successfully",
      lead
    });
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ 
      message: "Error updating lead", 
      error: error.message 
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