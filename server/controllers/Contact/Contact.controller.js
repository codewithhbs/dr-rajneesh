const Contact = require("../../models/users/contact.model");


exports.createContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const contact = await Contact.create({
      name,
      email,
      phone,
      message,
      created_by: req.user ? "user" : "guest",
    });

    return res.status(201).json({
      success: true,
      message: "Your message has been submitted successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Create Contact Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    console.error("Get Contacts Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


exports.markAsSeen = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { is_seen: true },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Marked as seen",
      data: contact,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


exports.solveContact = async (req, res) => {
  try {
    const { admin_comment } = req.body;

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        is_solved: true,
        admin_comment,
        solved_at: new Date(),
      },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact marked as solved",
      data: contact,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
