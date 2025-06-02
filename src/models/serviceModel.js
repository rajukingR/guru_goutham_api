import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Service = sequelize.define('Service', {
    service_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    product_id: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    product_image: {
      type: DataTypes.STRING(255)
    },
    type: {
      type: DataTypes.STRING(100)
    },
    priority: {
      type: DataTypes.STRING(50)
    },
    order_no: {
      type: DataTypes.STRING(100)
    },
    client_id: {
      type: DataTypes.STRING(100)
    },
    service_staff: {
      type: DataTypes.STRING(100)
    },
    start_datetime: {
      type: DataTypes.DATE
    },
    end_datetime: {
      type: DataTypes.DATE
    },
    task_duration: {
      type: DataTypes.STRING(50)
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'Services',
    timestamps: false,
    freezeTableName: true // Ensures table name isn't pluralized
  });

  return Service;
};