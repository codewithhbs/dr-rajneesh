const AddOn = require("../../models/services/addon.model");

// -----------------------------
// CREATE AddOn
// -----------------------------
exports.createAddOn = async (req, res) => {
  try {
    const { title, price, discount_price, position, is_active } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Title and price are required",
      });
    }

    const addOn = new AddOn({
      title,
      price,
      discount_price,
      position: position || 0,
      is_active: is_active !== undefined ? is_active : true,
    });

    await addOn.save();

    res.status(201).json({
      success: true,
      data: addOn,
      message: "AddOn created successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// -----------------------------
// GET All AddOns
// -----------------------------
exports.getAllAddOns = async (req, res) => {
  try {
    const addOns = await AddOn.find().sort({ position: 1 }); // Sorted by position
    res.json({ success: true, data: addOns });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// -----------------------------
// GET Single AddOn by ID
// -----------------------------
exports.getAddOnById = async (req, res) => {
  try {
    const { id } = req.params;
    const addOn = await AddOn.findById(id);

    if (!addOn) {
      return res.status(404).json({ success: false, message: "AddOn not found" });
    }

    res.json({ success: true, data: addOn });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// -----------------------------
// UPDATE AddOn
// -----------------------------
exports.updateAddOn = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const addOn = await AddOn.findByIdAndUpdate(id, updates, { new: true });

    if (!addOn) {
      return res.status(404).json({ success: false, message: "AddOn not found" });
    }

    res.json({ success: true, data: addOn, message: "AddOn updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// -----------------------------
// DELETE AddOn (Soft Delete)
// -----------------------------
exports.deleteAddOn = async (req, res) => {
  try {
    const { id } = req.params;

    const addOn = await AddOn.findByIdAndUpdate(
      id,
      { is_active: false },
      { new: true }
    );

    if (!addOn) {
      return res.status(404).json({ success: false, message: "AddOn not found" });
    }

    res.json({ success: true, message: "AddOn deactivated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
