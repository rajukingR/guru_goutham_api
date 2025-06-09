// src/models/BranchModel.js
export default (sequelize, DataTypes) => {
  const Branch = sequelize.define("Branch", {
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
    tableName: "branches",
    timestamps: true,
    underscored: true,
  });

  return Branch;
};
