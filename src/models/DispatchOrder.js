export default (sequelize, DataTypes) => {
  const DispatchOrder = sequelize.define('DispatchOrder', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    dispatch_order_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    dispatch_order_title: {
      type: DataTypes.STRING(255)
    },
    dispatch_order_status: {
      type: DataTypes.STRING(50)
    },
    convert_rent_to_sale: {
      type: DataTypes.STRING(50)
    },
    dispatch_order_date: {
      type: DataTypes.DATEONLY
    },
    rental_end_date: DataTypes.DATE,
    order_sale_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    order_id: {
      type: DataTypes.INTEGER
    },
    order_number: {
      type: DataTypes.STRING(50)
    },
    customer_code: {
      type: DataTypes.INTEGER
    },
    shipping_name: {
      type: DataTypes.STRING(255)
    },
    shipping_phone_number: {
      type: DataTypes.STRING(20)
    },
    shipping_ordered_by: {
      type: DataTypes.STRING(255)
    },
    email: {
      type: DataTypes.STRING(255)
    },
    gst_number: {
      type: DataTypes.STRING(100)
    },
    pan_number: {
      type: DataTypes.STRING(100)
    },
    payment_type: {
      type: DataTypes.STRING(50)
    },
    type: {
      type: DataTypes.STRING(50)
    },
    pincode: {
      type: DataTypes.STRING(10)
    },
    city: {
      type: DataTypes.STRING(100)
    },
    state: {
      type: DataTypes.STRING(100)
    },
    country: {
      type: DataTypes.STRING(100)
    },
    street: {
      type: DataTypes.STRING(255)
    },
    landmark: {
      type: DataTypes.STRING(255)
    },
    industry: {
      type: DataTypes.STRING(255)
    },
    remarks: {
      type: DataTypes.TEXT
    },
    dealer_reference: {
      type: DataTypes.STRING(255)
    },
    is_dispatch_order: {
      type: DataTypes.BOOLEAN
    },
    regular_dispatch_order: {
      type: DataTypes.BOOLEAN
    },
    // ✅ NEW COLUMN
    peripheral_update: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_direct_invoice: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'dispatch_orders',
    timestamps: false
  });

  DispatchOrder.associate = (models) => {
    DispatchOrder.hasMany(models.DispatchOrderItem, {
      foreignKey: 'dispatch_order_id',
      as: 'items',
      onDelete: 'CASCADE'
    });

    DispatchOrder.belongsTo(models.Contact, {
      foreignKey: 'customer_code',
      targetKey: 'id', // Contact.id → DispatchOrder.customer_code
      as: 'contact'
    });

    // 👇 Add this association
    DispatchOrder.hasMany(models.DeliveryChallan, {
      foreignKey: 'dispatch_order_id',
      as: 'delivery_challans',
      onDelete: 'CASCADE'
    });

    DispatchOrder.hasOne(models.OrderAddress, {
      foreignKey: 'order_id',
      sourceKey: 'order_id', // match DispatchOrder.order_id → OrderAddress.order_id
      as: 'order_address'
    });

  };



  return DispatchOrder;
};