// AssetModel.js
const Asset = (sequelize, DataTypes) => {
  return sequelize.define('Asset', {
    asset_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    asset_tag_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    parent_asset_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    product_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    purchase_order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    supplier: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stock_location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    asset_status: {
      type: DataTypes.ENUM('Available', 'Unavailable', 'In Use', 'Damaged'),
      defaultValue: 'Available',
    },
    client: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    purchase_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    warranty_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    warranty_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    warranty_period: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    tableName: 'assets',
    timestamps: false,
    underscored: true,
  });
};

export default Asset;
