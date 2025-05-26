export default (sequelize, DataTypes) => {
  const SupplierAddress = sequelize.define('SupplierAddress', {
    address_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    supplier_id: {
      type: DataTypes.INTEGER,
    },
    address_line1: {
      type: DataTypes.STRING,
    },
    address_line2: {
      type: DataTypes.STRING,
    },
    pincode: {
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
    telephone1: {
      type: DataTypes.STRING,
    },
    telephone2: {
      type: DataTypes.STRING,
    },
    website: {
      type: DataTypes.STRING,
    },
    fax: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
  }, {
    tableName: 'supplier_addresses',
    timestamps: false,
  });

   SupplierAddress.associate = models => {
    SupplierAddress.belongsTo(models.Supplier, { foreignKey: 'supplier_id' });
  };
  
  return SupplierAddress;
};
