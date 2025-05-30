export default (sequelize, DataTypes) => {
  const GRN = sequelize.define('GRN', {
    grn_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    grn_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    grn_title: {
      type: DataTypes.STRING,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    customer_name: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    phone_number: {
      type: DataTypes.STRING,
    },
    grn_date: {
      type: DataTypes.DATE,
    },
    gst_number: {
      type: DataTypes.STRING,
    },
    pan_number: {
      type: DataTypes.STRING,
    },
    grn_created_by: {
      type: DataTypes.STRING,
    },
    industry: {
      type: DataTypes.STRING,
    },

    // Address Details
    company_name: {
      type: DataTypes.STRING,
    },
    country: {
      type: DataTypes.STRING,
    },
    state: {
      type: DataTypes.STRING,
    },
    city: {
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

    // Person Info
    informed_person_name: {
      type: DataTypes.STRING,
    },
    informed_person_phone: {
      type: DataTypes.STRING,
    },
    returner_name: {
      type: DataTypes.STRING,
    },
    returner_phone: {
      type: DataTypes.STRING,
    },
    receiver_name: {
      type: DataTypes.STRING,
    },
    receiver_phone: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.TEXT,
    },
    vehicle_number: {
      type: DataTypes.STRING,
    },

    invoice_number: {
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
    tableName: 'grn',
    timestamps: false,
  });

  return GRN;
};
