import db from "../models/index.js";

const {
    Peripheral,
    PeripheralItem,
    DeliveryChallan,
    ProductTemplete
} = db;

// Helper: transform payload items { RAM: [...], SSD: [...], ... } → flat []
function flattenItems(itemsByCategory = {}) {
    const flat = [];
    for (const [category, items] of Object.entries(itemsByCategory)) {
        if (Array.isArray(items)) {
            items.forEach((it) => {
                flat.push({
                    product_id: it.product_id,
                    product_category: category,
                    asset_id: it.asset_id,
                    device_id: it.device_ids?. [0] || null,
                    brand: it.brand || it.product?.brand || null,
                    model: it.model || it.product?.model || null,
                    specifications: it.specifications ||
                        it.product?.ram ||
                        it.product?.storage ||
                        it.product?.capacity ||
                        null,
                    quantity: 1,
                    purchase_price: it.purchase_price || it.product?.purchase_price || 0,
                    rent_price_per_month: it.rent_price_per_month || it.product?.rent_price_per_month || 0,
                });
            });
        }
    }
    return flat;
}

export const createPeripheral = async (req, res) => {
    try {
        const {
            parent_product_id,
            delivery_challan_id,
            product_name,
            parent_asset_id,
            ram,
            storage,
            approval_date,
            items = {},
        } = req.body;

        // ✅ Check if a peripheral with this challan_id already exists
        const existingPeripheral = await Peripheral.findOne({
            where: { challan_id: delivery_challan_id },
            include: [{ model: PeripheralItem, as: "items" }],
        });

        if (existingPeripheral) {
            return res.status(400).json({
                message: "Peripheral for this delivery challan already exists",
                peripheral: existingPeripheral,
            });
        }

        const flatItems = flattenItems(items);

        const peripheral = await Peripheral.create({
            parent_product_id,
            challan_id: delivery_challan_id,
            product_name,
            parent_asset_id,
            ram,
            storage,
            approved_date: approval_date,
            items: flatItems,
        }, {
            include: [{
                model: PeripheralItem,
                as: "items"
            }],
        });

        res.status(201).json(peripheral);
    } catch (error) {
        console.error("Error creating peripheral:", error);
        res.status(500).json({
            error: "Failed to create peripheral"
        });
    }
};


// ✅ Get all Peripherals (with DeliveryChallan + Items + Product info)
export const getAllPeripherals = async (req, res) => {
    try {
        const peripherals = await Peripheral.findAll({
            include: [{
                model: PeripheralItem,
                as: "items",
            }, ],
        });

        res.status(200).json(peripherals);
    } catch (error) {
        console.error("Error fetching peripherals:", error);
        res.status(500).json({
            error: "Failed to fetch peripherals"
        });
    }
};

// ✅ Get Peripheral by ID
export const getPeripheralById = async (req, res) => {
    try {
        const {
            id
        } = req.params;

        const peripheral = await Peripheral.findByPk(id, {
            include: [{
                    model: DeliveryChallan,
                    as: "delivery_challan"
                },
                {
                    model: PeripheralItem,
                    as: "items",
                   
                },
            ],
        });

        if (!peripheral) {
            return res.status(404).json({
                error: "Peripheral not found"
            });
        }

        res.status(200).json(peripheral);
    } catch (error) {
        console.error("Error fetching peripheral:", error);
        res.status(500).json({
            error: "Failed to fetch peripheral"
        });
    }
};

// ✅ Update Peripheral (with new items)
export const updatePeripheral = async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const {
            parent_product_id,
            product_name,
            delivery_challan_id,
            parent_asset_id,
            ram,
            storage,
            approval_date,
            items = {},
        } = req.body;

        const peripheral = await Peripheral.findByPk(id);
        if (!peripheral) {
            return res.status(404).json({
                error: "Peripheral not found"
            });
        }

        await peripheral.update({
            parent_product_id,
            product_name,
            challan_id: delivery_challan_id,
            parent_asset_id,
            ram,
            storage,
            approved_date: approval_date,
        });

        // Refresh items
        await PeripheralItem.destroy({
            where: {
                peripheral_id: id
            }
        });

        const flatItems = flattenItems(items);
        if (flatItems.length) {
            await PeripheralItem.bulkCreate(
                flatItems.map((it) => ({
                    ...it,
                    peripheral_id: id
                }))
            );
        }

        const updatedPeripheral = await Peripheral.findByPk(id, {
            include: [{
                model: PeripheralItem,
                as: "items"
            }],
        });

        res.status(200).json(updatedPeripheral);
    } catch (error) {
        console.error("Error updating peripheral:", error);
        res.status(500).json({
            error: "Failed to update peripheral"
        });
    }
};

// ✅ Delete Peripheral (cascade deletes items)
export const deletePeripheral = async (req, res) => {
    try {
        const {
            id
        } = req.params;

        const peripheral = await Peripheral.findByPk(id);
        if (!peripheral) {
            return res.status(404).json({
                error: "Peripheral not found"
            });
        }

        await peripheral.destroy();

        res.status(200).json({
            message: "Peripheral deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting peripheral:", error);
        res.status(500).json({
            error: "Failed to delete peripheral"
        });
    }
};