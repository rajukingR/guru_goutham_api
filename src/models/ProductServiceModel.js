// src/models/ProductService.js
export default (sequelize, DataTypes) => {
  const ProductService = sequelize.define(
    "ProductService",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      image_url: {
        type: DataTypes.STRING,
      },
      product_id: {
        type: DataTypes.STRING,
      },
      product_name: {
        type: DataTypes.STRING,
      },
      type: {
        type: DataTypes.STRING,
      },
      priority: {
        type: DataTypes.STRING,
      },
      order_no: {
        type: DataTypes.STRING,
      },
      client_id: {
        type: DataTypes.STRING,
      },
      service_staff: {
        type: DataTypes.STRING,
      },
      start_datetime: {
        type: DataTypes.DATE,
      },
      end_datetime: {
        type: DataTypes.DATE,
      },
      task_duration: {
        type: DataTypes.STRING,
      },
      active_status: {
        type: DataTypes.BOOLEAN,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "ProductService", 
      timestamps: false,
    }
  );

  return ProductService;
};
