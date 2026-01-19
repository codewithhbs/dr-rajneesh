const OtherService = require("../../models/services/OtherService.model");

/* =========================
   CREATE (auto position)
========================= */
exports.createService = async (req, res) => {
  try {
    const { title, isActive } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const lastService = await OtherService.findOne()
      .sort({ position: -1 })
      .select("position");

    const nextPosition = lastService ? lastService.position + 1 : 1;

    const service = await OtherService.create({
      title,
      isActive: isActive ?? true,
      position: nextPosition,
    });

    return res.status(201).json({
      success: true,
      service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create service",
      error: error.message,
    });
  }
};

/* =========================
   GET ALL (sorted)
========================= */
exports.getServices = async (req, res) => {
  try {
    const services = await OtherService.find()
      .sort({ position: 1 })
      .lean();

    res.json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch services",
      error: error.message,
    });
  }
};

/* =========================
   GET BY ID
========================= */
exports.getServiceById = async (req, res) => {
  try {
    const service = await OtherService.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    res.json({
      success: true,
      service,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid service ID",
    });
  }
};

/* =========================
   UPDATE (with position shuffle)
========================= */
exports.updateService = async (req, res) => {
  try {
    const { title, isActive, position } = req.body;

    const service = await OtherService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // 🔁 POSITION SHUFFLE
    if (position && position !== service.position) {
      const total = await OtherService.countDocuments();

      if (position < 1 || position > total) {
        return res.status(400).json({
          success: false,
          message: "Invalid position",
        });
      }

      if (position > service.position) {
        // move down
        await OtherService.updateMany(
          { position: { $gt: service.position, $lte: position } },
          { $inc: { position: -1 } }
        );
      } else {
        // move up
        await OtherService.updateMany(
          { position: { $gte: position, $lt: service.position } },
          { $inc: { position: 1 } }
        );
      }

      service.position = position;
    }

    if (title !== undefined) service.title = title;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();

    res.json({
      success: true,
      service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update service",
      error: error.message,
    });
  }
};

/* =========================
   DELETE (auto reindex)
========================= */
exports.deleteService = async (req, res) => {
  try {
    const service = await OtherService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const deletedPosition = service.position;
    await service.deleteOne();

    // 🔁 Reorder remaining services
    await OtherService.updateMany(
      { position: { $gt: deletedPosition } },
      { $inc: { position: -1 } }
    );

    res.json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete service",
      error: error.message,
    });
  }
};
