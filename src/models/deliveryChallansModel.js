export default (sequelize, DataTypes) => {
  const DeliveryChallan = sequelize.define('DeliveryChallan', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    dc_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dc_title: {
      type: DataTypes.STRING,
    },
    is_dc: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    order_id: {
      type: DataTypes.INTEGER,
    },
    dispatch_order_id: {
      type: DataTypes.INTEGER,
    },
    dispatch_order_number: {
      type: DataTypes.STRING,
    },

    customer_code: {
      type: DataTypes.INTEGER, // ✅ MATCH contacts.id if integer
    },
    order_number: {
      type: DataTypes.STRING,
    },
    uploaded_dc: {
      type: DataTypes.STRING,
    },
    dc_date: {
      type: DataTypes.DATEONLY,
    },
    dc_status: {
      type: DataTypes.STRING,
    },
    order_sale_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    convert_rent_to_sale: {
      type: DataTypes.STRING(50)
    },
    dealer_reference: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    gst_number: {
      type: DataTypes.STRING,
    },
    pan_number: {
      type: DataTypes.STRING,
    },
    remarks: {
      type: DataTypes.TEXT,
    },
    dc_file: {
      type: DataTypes.STRING,
    },
    type: {
      type: DataTypes.STRING,
    },
    payment_type: {
      type: DataTypes.STRING,
    },
    regular_dc: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    industry: {
      type: DataTypes.STRING,
    },
    shipping_ordered_by: {
      type: DataTypes.STRING,
    },
    shipping_phone_number: {
      type: DataTypes.STRING,
    },
    shipping_name: {
      type: DataTypes.STRING,
    },
    street: {
      type: DataTypes.STRING,
    },
    landmark: {
      type: DataTypes.STRING,
    },
    pincode: {
      type: DataTypes.STRING,
    },
    city: {
      type: DataTypes.STRING,
    },
    state: {
      type: DataTypes.STRING,
    },
    country: {
      type: DataTypes.STRING,
    },
    vehicle_number: {
      type: DataTypes.STRING,
    },
    delivery_person_name: {
      type: DataTypes.STRING,
    },
    delivery_person_phone_number: {
      type: DataTypes.STRING,
    },
    // ✅ NEW COLUMN
    peripheral_update: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    receiver_name: {
      type: DataTypes.STRING,
    },
    receiver_phone_number: {
      type: DataTypes.STRING,
    },
    other_accessory: {
      type: DataTypes.JSON, // <-- Now supports JSON
      allowNull: true,
      defaultValue: {}, // Start with empty object
    },

    // ✅ NEW COLUMNS
    mouse: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    cable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    bag: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    mouse_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    cable_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    bag_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    others_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    defualt_dc: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    others: {
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
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'delivery_challans',
    timestamps: false,
  });

  DeliveryChallan.associate = (models) => {
    DeliveryChallan.hasMany(models.DeliveryChallanItem, {
      foreignKey: 'challan_id',
      as: 'items',
    });

    DeliveryChallan.belongsTo(models.Contact, {
      foreignKey: 'customer_code',
      targetKey: 'id', // ✅ Ensure this matches your contacts PK
      as: 'customer',
    });


    DeliveryChallan.belongsTo(models.DispatchOrder, {
      foreignKey: 'dispatch_order_id',
      as: 'dispatch_order',
    });

  };

  return DeliveryChallan;
};