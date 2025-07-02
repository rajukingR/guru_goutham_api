export default (sequelize, DataTypes) => {
  const CreditNote = sequelize.define('CreditNote', {
    credit_note_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    credit_note_title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transaction_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    payment_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dc_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    customer_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    invoice_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    invoice_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    invoice_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    invoice_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    returned_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    customer_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pan: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shipping_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    print_credit_note: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  }, {
    tableName: 'CreditNotes',
    timestamps: true,
    underscored: true,
  });

  // Associations should be attached here using a separate function
  CreditNote.associate = (models) => {
    CreditNote.hasMany(models.CreditNoteItem, {
      foreignKey: 'credit_note_id',
      as: 'items',
    });
  };

  return CreditNote;
};