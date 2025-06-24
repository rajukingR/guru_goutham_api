
export default (sequelize, DataTypes) => {
  const ClientDetails = sequelize.define('ClientDetails', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    client_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    customer_industry: {
      type: DataTypes.STRING(100),
    },
    client_name: {
      type: DataTypes.STRING(100),
    },
    phone_number: {
      type: DataTypes.STRING(20),
    },
    company_name: {
      type: DataTypes.STRING(100),
    },
    rental_cost: {
      type: DataTypes.DECIMAL(10, 2),
    },
    product_cost: {
      type: DataTypes.DECIMAL(10, 2),
    },
    client_status: {
      type: DataTypes.STRING(50),
    },
    rental_start_date: {
      type: DataTypes.DATEONLY,
    },
    rental_return_date: {
      type: DataTypes.DATEONLY,
    },
    email: {
      type: DataTypes.STRING(150),
    },
    address: {
      type: DataTypes.TEXT,
    },
    country: {
      type: DataTypes.STRING(50),
    },
    state: {
      type: DataTypes.STRING(50),
    },
    city: {
      type: DataTypes.STRING(50),
    },
    active_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'client_details',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return ClientDetails;
};
