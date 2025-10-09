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
    dispatch_order_id: {
      type: DataTypes.INTEGER, // updated from dc_id
      allowNull: true,
    },
    dispatch_order_number: {
      type: DataTypes.STRING(100), // updated from dc_number
      allowNull: true,
    },
    // 🔹 Newly added columns
    collected_person_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    collected_person_no: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    vehicle_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    dc_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    customer_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    returned_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    rental_end_date: DataTypes.DATE,

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

  CreditNote.associate = (models) => {
    CreditNote.hasMany(models.CreditNoteItem, {
      foreignKey: 'credit_note_id',
      as: 'items',
    });
    CreditNote.belongsTo(models.Contact, {
      foreignKey: 'customer_id',
      targetKey: 'id',
      as: 'customer',
    });

    CreditNote.belongsTo(models.Invoice, {
      foreignKey: "dispatch_order_id",
      targetKey: "dispatch_order_id",
      as: "invoice",
    });

    CreditNote.hasOne(models.AssetSwap, {
      foreignKey: 'credit_note_id',
      as: 'asset_swap'
    });

    CreditNote.hasOne(models.AssetTransaction, {
      foreignKey: 'credit_note_id',
      as: 'asset_transactions'
    });


    // Optional: Add association with DispatchOrder if needed
    // CreditNote.belongsTo(models.DispatchOrder, {
    //   foreignKey: 'dispatch_order_id',
    //   as: 'dispatch_order'
    // });
  };

  return CreditNote;
};