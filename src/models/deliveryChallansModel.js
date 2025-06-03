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
    customer_code: {
      type: DataTypes.STRING,
    },
    order_number: {
      type: DataTypes.STRING,
    },
    dc_date: {
      type: DataTypes.DATEONLY,
    },
    dc_status: {
      type: DataTypes.STRING,
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
    receiver_name: {
      type: DataTypes.STRING,
    },
    receiver_phone_number: {
      type: DataTypes.STRING,
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
};


  return DeliveryChallan;
};
