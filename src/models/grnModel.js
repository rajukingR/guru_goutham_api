export default (sequelize, DataTypes) => {
  const GRN = sequelize.define('GRN', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    grn_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    order_id: {
  type: DataTypes.STRING,
  allowNull: true, // or false, if required
},

    grn_title: {
      type: DataTypes.STRING,
    },
customer_id: {
  type: DataTypes.STRING,
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
    grn_status: {
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


GRN.associate = (models) => {
  GRN.hasMany(models.GRNItem, {
    foreignKey: 'grn_id',
    as: 'items',
  });
  GRN.belongsTo(models.Order, {
    foreignKey: 'order_id',
    as: 'order',
  });
  GRN.belongsTo(models.Contact, {
  foreignKey: 'customer_id',
  as: 'customer_details'
});

};



  return GRN;
};
