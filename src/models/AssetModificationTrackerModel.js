// src/models/AssetModificationTrackerModel.js
export default (sequelize, DataTypes) => {
  const AssetModificationTracker = sequelize.define('AssetModificationTracker', {
    asset_image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    asset_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    asset_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    modification_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reason_for_modification: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    requested_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    approved_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    request_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    approval_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    estimated_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    active_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  }, {
    tableName: 'AssetModificationTracker',
    timestamps: true
  });

  return AssetModificationTracker;
};
