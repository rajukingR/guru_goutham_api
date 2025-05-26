export default (sequelize, DataTypes) => {
  const SupplierContact = sequelize.define('SupplierContact', {
    contact_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    supplier_id: {
      type: DataTypes.INTEGER,
    },
    contact_name: {
      type: DataTypes.STRING,
    },
    designation: {
      type: DataTypes.STRING,
    },
    contact_landline: {
      type: DataTypes.STRING,
    },
    landline_extension: {
      type: DataTypes.STRING,
    },
    contact_email: {
      type: DataTypes.STRING,
    },
    contact_number: {
      type: DataTypes.STRING,
    },
  }, {
    tableName: 'supplier_contacts',
    timestamps: false,
  });


  SupplierContact.associate = models => {
    SupplierContact.belongsTo(models.Supplier, { foreignKey: 'supplier_id' });
  };

  
  return SupplierContact;
};
