export default (sequelize, DataTypes) => {
  const InvoiceItem = sequelize.define('InvoiceItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    invoice_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
    },
    product_name: {
      type: DataTypes.STRING,
    },
    quantity: {
      type: DataTypes.INTEGER,
    },
     previous_quantity: {
      type: DataTypes.INTEGER,     // ✅ Newly added
      defaultValue: 0,
    },
    order_id: {
  type: DataTypes.INTEGER,
  allowNull: true,
},
device_ids: {
  type: DataTypes.TEXT, // store as JSON stringified array
  allowNull: true,
  get() {
    const rawValue = this.getDataValue('device_ids');
    return rawValue ? JSON.parse(rawValue) : [];
  },
  set(value) {
    this.setDataValue('device_ids', JSON.stringify(value));
  },
},

    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
    },
    total_price: {
      type: DataTypes.DECIMAL(12, 2),
    },
    cgst: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    sgst: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    igst: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    total_tax: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    rental_duration_months: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    rental_duration_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    new_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    added_date: {
      type: DataTypes.DATEONLY,
    },
    return_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    new_device_ids: {
  type: DataTypes.TEXT,
  get() {
    const raw = this.getDataValue('new_device_ids');
    return raw ? JSON.parse(raw) : [];
  },
  set(value) {
    // ✅ Only stringify once
    this.setDataValue('new_device_ids', JSON.stringify(value || []));
  },
},
returned_device_ids: {
  type: DataTypes.TEXT,
  get() {
    const raw = this.getDataValue('returned_device_ids');
    return raw ? JSON.parse(raw) : [];
  },
  set(value) {
    this.setDataValue('returned_device_ids', JSON.stringify(value || []));
  },
},


    returned_date: {
      type: DataTypes.DATEONLY,
    }
  }, {
    tableName: 'invoice_items',
    timestamps: false,
  });

  InvoiceItem.associate = (models) => {
    InvoiceItem.belongsTo(models.Invoice, {
      foreignKey: 'invoice_id',
      as: 'invoice',
    });

    InvoiceItem.belongsTo(models.ProductTemplete, {
      foreignKey: 'product_id',
      as: 'productDetails',
    });
  };

  return InvoiceItem;
};