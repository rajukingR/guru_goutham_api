export default (sequelize, DataTypes) => {
  const StockLocation = sequelize.define(
    "StockLocation",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      stock_location_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      stock_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      mail_id: {
        type: DataTypes.STRING(100),
        validate: {
          isEmail: true,
        },
      },
      phone_no: {
        type: DataTypes.STRING(20),
      },
      pincode: {
        type: DataTypes.STRING(10),
      },
      country: {
        type: DataTypes.STRING(100),
      },
      state: {
        type: DataTypes.STRING(100),
      },
      city: {
        type: DataTypes.STRING(100),
      },
      landmark: {
        type: DataTypes.STRING(255),
      },
      street: {
        type: DataTypes.STRING(255),
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "created_at",
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: "updated_at",
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "StockLocation",
      timestamps: true,
      underscored: true,
    }
  );

  return StockLocation;
};
