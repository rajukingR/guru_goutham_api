// src/models/GradeModel.js

const Grade = (sequelize, DataTypes) => {
  return sequelize.define('Grade', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    grade_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    grade_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    tableName: 'Grade',
    timestamps: false,
    underscored: true,
  });
};

export default Grade;
