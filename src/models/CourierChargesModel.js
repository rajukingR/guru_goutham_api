export default (sequelize, DataTypes) => {
  const CourierCharges = sequelize.define('CourierCharges', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    invoice_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    service_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    service_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    addresses: {
      type: DataTypes.JSON,
      allowNull: false,
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
    tableName: 'courier_charges',
    timestamps: false,
    underscored: true,
  });

  CourierCharges.associate = (models) => {
  CourierCharges.belongsTo(models.Contact, {
    foreignKey: 'customer_id',
    targetKey: 'id',
    as: 'customer',
  });
};


  return CourierCharges;
};
