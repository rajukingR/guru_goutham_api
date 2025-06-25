// models/ServicePriorityLevelModel.js
export default (sequelize, DataTypes) => {
  const ServicePriorityLevel = sequelize.define(
    'ServicePriorityLevel',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      priority_level: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
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
    },
    {
      tableName: 'service_priority_levels',
      timestamps: false,
      underscored: true,
    }
  );

  return ServicePriorityLevel;
};
