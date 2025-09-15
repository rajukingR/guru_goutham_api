export default (sequelize, DataTypes) => {
  const Contact = sequelize.define('Contact', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    company_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    customer_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true
    },

    payment_type: {
      type: DataTypes.ENUM('Prepaid', 'Approved', 'Postpaid'),
      defaultValue: 'Prepaid',
    },
    address: {
      type: DataTypes.JSON,
      allowNull: true
    },
    gst: {
      type: DataTypes.STRING,
      allowNull: true
    },
    pan_no: {
      type: DataTypes.STRING,
      allowNull: true
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: true
    },
    remarks: {
      type: DataTypes.STRING,
      allowNull: true
    },
    contact_generated_by: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'contacts',
    timestamps: false
  });

  Contact.associate = (models) => {
    Contact.hasMany(models.DispatchOrder, {
      foreignKey: 'customer_code',
      sourceKey: 'id',
      as: 'dispatch_orders'
    });

    Contact.hasMany(models.CourierCharges, {
      foreignKey: 'customer_id',
      sourceKey: 'id',
      as: 'courier_charges',
    });
    Contact.hasMany(models.ServiceCharges, {
      foreignKey: 'customer_id',
      sourceKey: 'id',
      as: 'service_charges',
    });
  };


  return Contact;
};