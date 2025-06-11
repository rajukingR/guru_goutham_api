export default (sequelize, DataTypes) => {
  const StockLocation = sequelize.define('StockLocation', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    stock_location_id: {
      type: DataTypes.STRING(100),
    },
    stock_name: {
      type: DataTypes.STRING(100),
    },
    mail_id: {
      type: DataTypes.STRING(100),
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
    },
    created_at: {
      type: DataTypes.DATE,
    },
    updated_at: {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'StockLocation',
    timestamps: false,
  });

  return StockLocation;
};
