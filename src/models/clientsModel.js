export default (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    client_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    client_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    company_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    customer_industry: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    product_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    rental_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    rental_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    rental_return_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    client_status: {
      type: DataTypes.STRING(50),
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
    tableName: 'clients',
    timestamps: false,
  });

  return Client;
};
