export default (sequelize, DataTypes) => {
  const Quotation = sequelize.define('Quotation', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    quotation_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quotation_title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rental_start_date: {
      type: DataTypes.DATE,
    },
    rental_end_date: {
      type: DataTypes.DATE,
    },
    quotation_date: {
      type: DataTypes.DATE,
    },
    rental_duration: {
      type: DataTypes.INTEGER,
    },
    remarks: {
      type: DataTypes.TEXT,
    },
    quotation_generated_by: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      defaultValue: 'Pending',
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
    tableName: 'quotations',
    timestamps: false,
  });


   Quotation.associate = (models) => {
    Quotation.hasMany(models.QuotationItem, {
      foreignKey: 'quotation_id',
      as: 'items',
    });
  };


  return Quotation;
};
