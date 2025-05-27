export default (sequelize, DataTypes) => {
  const Invoice = sequelize.define('Invoice', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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

  return Invoice;
};
