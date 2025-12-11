export default (sequelize, DataTypes) => {
  const CreditNoteItem = sequelize.define('CreditNoteItem', {
    credit_note_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    peripheral_asset_id_product_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // MUST be true
            defaultValue: null
        },
    product_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    device_ids: {
      type: DataTypes.JSON,
      allowNull: true,
    }
  }, {
    tableName: 'credit_note_items',
    timestamps: true,
    underscored: true,
  });

  CreditNoteItem.associate = (models) => {
    CreditNoteItem.belongsTo(models.CreditNote, {
      foreignKey: 'credit_note_id',
      as: 'credit_note',
    });

    CreditNoteItem.belongsTo(models.ProductTemplete, {
      foreignKey: 'product_id',
      as: 'product'
    });
  };

  return CreditNoteItem;
};
