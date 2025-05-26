export default (sequelize, DataTypes) => {
  const BankDetail = sequelize.define('BankDetail', {
    bank_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    supplier_id: {
      type: DataTypes.INTEGER,
    },
    bank_name: {
      type: DataTypes.STRING,
    },
    bank_address: {
      type: DataTypes.STRING,
    },
    account_number: {
      type: DataTypes.STRING,
    },
    pan_number: {
      type: DataTypes.STRING,
    },
  }, {
    tableName: 'bank_details',
    timestamps: false,
  });


   BankDetail.associate = models => {
    BankDetail.belongsTo(models.Supplier, { foreignKey: 'supplier_id' });
  };
  
  return BankDetail;
};
