export default (sequelize, DataTypes) => {
  const AssetSwap = sequelize.define('AssetSwap', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    asset_id: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    purchase_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    rent_price_per_month: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    show_client_assets: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    show_warehouse_assets: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    reason: {
      type: DataTypes.STRING(255),
      defaultValue: 'Damaged / Faulty'
    },
    swapped_on: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    credit_note_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'asset_swaps',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  AssetSwap.associate = (models) => {
    AssetSwap.belongsTo(models.CreditNote, {
      foreignKey: 'credit_note_id',
      as: 'credit_note'
    });
  };

  return AssetSwap;
};