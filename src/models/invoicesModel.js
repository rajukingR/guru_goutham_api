export default (sequelize, DataTypes) => {
  const Invoice = sequelize.define('Invoice', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    dc_id: {
      type: DataTypes.STRING,
    },
    order_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    invoice_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    invoice_title: {
      type: DataTypes.STRING,
    },
    customer_id: {
      type: DataTypes.INTEGER,
    },
    customer_name: {
      type: DataTypes.STRING,
    },
    invoice_date: {
      type: DataTypes.DATE,
    },
    invoice_due_date: {
      type: DataTypes.DATE,
    },

    // ✅ New fields
    invoice_start_date: {
      type: DataTypes.DATE,
    },
    invoice_end_date: {
      type: DataTypes.DATE,
    },
    previous_delivered_start_date: {
      type: DataTypes.DATE,
    },
    previous_delivered_end_date: {
      type: DataTypes.DATE,
    },
    credit_note_start_date: {
      type: DataTypes.DATE,
    },
    credit_note_end_date: {
      type: DataTypes.DATE,
    },
    rental_start_date: {
      type: DataTypes.DATE,
    },
    rental_end_date: {
      type: DataTypes.DATE,
    },

    duration: {
      type: DataTypes.STRING,
    },
    rental_duration_months: DataTypes.INTEGER,
    rental_duration_days: DataTypes.INTEGER,
    purchase_order_date: {
      type: DataTypes.DATE,
    },
    purchase_order_number: {
      type: DataTypes.STRING,
    },
    customer_gst_number: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    phone_number: {
      type: DataTypes.STRING,
    },
    pan_number: {
      type: DataTypes.STRING,
    },
    payment_terms: {
      type: DataTypes.STRING,
    },
    payment_mode: {
      type: DataTypes.STRING,
    },
    approval_status: {
      type: DataTypes.STRING,
    },
    approval_date: {
      type: DataTypes.DATE,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
    },
    cgst: {
      type: DataTypes.DECIMAL(12, 2),
    },
    sgst: {
      type: DataTypes.DECIMAL(12, 2),
    },
    igst: {
      type: DataTypes.DECIMAL(12, 2),
    },
    total_tax: {
      type: DataTypes.DECIMAL(12, 2),
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
    },
    invoice_consulting_by: {
      type: DataTypes.STRING,
    },
    industry: {
      type: DataTypes.STRING,
    },
    remarks: {
      type: DataTypes.TEXT,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'invoices',
    timestamps: false,
  });

  Invoice.associate = (models) => {
    Invoice.hasMany(models.InvoiceItem, {
      foreignKey: 'invoice_id',
      as: 'items',
    });

    Invoice.hasOne(models.InvoiceShippingDetail, {
      foreignKey: 'invoice_id',
      as: 'shippingDetail',
    });
  };

  return Invoice;
};