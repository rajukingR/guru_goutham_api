// src/models/BranchesModels.js
export default (sequelize, DataTypes) => {
  const BranchesModels = sequelize.define("BranchesModels", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    branch_code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    branch_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: false
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
    address: {
      type: DataTypes.TEXT,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    }
  }, {
    tableName: "branch",
    timestamps: true,
    underscored: true,
  });

  return BranchesModels;
};
