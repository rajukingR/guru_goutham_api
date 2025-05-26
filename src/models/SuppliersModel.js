export default (sequelize, DataTypes) => {
  const Supplier = sequelize.define('Supplier', {
    supplier_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    supplier_code: {
      type: DataTypes.STRING,
    },
    registration_date: {
      type: DataTypes.DATEONLY,
    },
    supplier_name: {
      type: DataTypes.STRING,
    },
    supplier_owner: {
      type: DataTypes.STRING,
    },
    gst_number: {
      type: DataTypes.STRING,
    },
    introduced_by: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.TEXT,
    },
  }, {
    tableName: 'suppliers',
    timestamps: false,
  });


   Supplier.associate = models => {
    Supplier.hasOne(models.SupplierAddress, { foreignKey: 'supplier_id', as: 'address' });
    Supplier.hasOne(models.BankDetail, { foreignKey: 'supplier_id', as: 'bank' });
    Supplier.hasMany(models.SupplierContact, { foreignKey: 'supplier_id', as: 'contacts' });
  };
  
  return Supplier;
};
