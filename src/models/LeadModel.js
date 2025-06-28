export default (sequelize, DataTypes) => {
  const Lead = sequelize.define('Lead', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    lead_id: DataTypes.STRING,
    lead_title: DataTypes.STRING,
    transaction_type: DataTypes.STRING,
    lead_source: DataTypes.STRING,
    source_of_enquiry: DataTypes.STRING,
    rental_duration_months: DataTypes.INTEGER,
    rental_start_date: DataTypes.DATEONLY,
    rental_end_date: DataTypes.DATEONLY,
    lead_date: DataTypes.DATEONLY,
    owner: DataTypes.STRING,
    remarks: DataTypes.TEXT,
    lead_generated_by: DataTypes.STRING,
    is_active: DataTypes.BOOLEAN,
    contact_id: DataTypes.INTEGER,
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'leads',
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Lead.associate = (models) => {
    Lead.belongsTo(models.Contact, {
      foreignKey: 'contact_id',
      as: 'contact'
    });

    Lead.hasMany(models.LeadProduct, {
      foreignKey: 'lead_id',
      as: 'lead_products'
    });

    Lead.hasMany(models.Quotation, {
      foreignKey: 'lead_id',
      as: 'quotations'
    });

    models.Quotation.belongsTo(Lead, {
      foreignKey: 'lead_id',
      as: 'lead'
    });
  };

  return Lead;
};
