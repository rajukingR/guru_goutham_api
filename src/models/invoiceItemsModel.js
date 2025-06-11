export default (sequelize, DataTypes) => {
  const InvoiceItem = sequelize.define('InvoiceItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    invoice_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
    },
    product_name: {
      type: DataTypes.STRING,
    },
    quantity: {
      type: DataTypes.INTEGER,
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
    },
    total_price: {
      type: DataTypes.DECIMAL(12, 2),
    },
  }, {
    tableName: 'invoice_items',
    timestamps: false,
  });


  InvoiceItem.associate = (models) => {
  InvoiceItem.belongsTo(models.Invoice, {
    foreignKey: 'invoice_id',
    as: 'invoice',
  });
};


  return InvoiceItem;
};
