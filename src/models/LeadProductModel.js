export default (sequelize, DataTypes) => {
  const LeadProduct = sequelize.define('LeadProduct', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'lead_products',
    timestamps: false
  });


  LeadProduct.associate = (models) => {
  LeadProduct.belongsTo(models.Lead, {
    foreignKey: 'lead_id',
    as: 'lead'
  });

  LeadProduct.belongsTo(models.ProductTemplete, {
    foreignKey: 'product_id',
    as: 'product'
  });
};


  return LeadProduct;
};
