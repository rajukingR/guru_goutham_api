export default (sequelize, DataTypes) => {
  const RamSpec = sequelize.define('RamSpec', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    ram_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    size_gb: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    frequency_mhz: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    manufacturer: {
      type: DataTypes.STRING,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'ram_specs',
    timestamps: false,
    underscored: true
  });

  return RamSpec;
};
