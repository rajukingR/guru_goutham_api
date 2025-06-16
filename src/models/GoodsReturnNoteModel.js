
export default (sequelize, DataTypes) => {
  const GoodsReturnNote = sequelize.define("GoodsReturnNote", {
    grn_id: {
      type: DataTypes.STRING,
    },
    grn_title: {
      type: DataTypes.STRING,
    },
    customer_id: {
      type: DataTypes.INTEGER,
    },
    customer_select: {
      type: DataTypes.STRING,
    },
    email_id: {
      type: DataTypes.STRING,
    },
    phone_no: {
      type: DataTypes.STRING,
    },
    grn_date: {
      type: DataTypes.DATEONLY,
    },
    gst_number: {
      type: DataTypes.STRING,
    },
    pan: {
      type: DataTypes.STRING,
    },
    grn_created_by: {
      type: DataTypes.STRING,
    },
    industry: {
      type: DataTypes.STRING,
    },
    company_name: {
      type: DataTypes.STRING,
    },
    pincode: {
      type: DataTypes.STRING,
    },
    country: {
      type: DataTypes.STRING,
    },
    state: {
      type: DataTypes.STRING,
    },
    city: {
      type: DataTypes.STRING,
    },
    street: {
      type: DataTypes.STRING,
    },
    landmark: {
      type: DataTypes.STRING,
    },
    informed_person_name: {
      type: DataTypes.STRING,
    },
    informed_person_phone_no: {
      type: DataTypes.STRING,
    },
    returner_name: {
      type: DataTypes.STRING,
    },
    returner_phone_no: {
      type: DataTypes.STRING,
    },
    receiver_name: {
      type: DataTypes.STRING,
    },
    receiver_phone_no: {
      type: DataTypes.STRING,
    },
    vehicle_number: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.TEXT,
    }
  }, {
    tableName: "goods_return_note",
    timestamps: true,
    underscored: true,
  });

  return GoodsReturnNote;
};
