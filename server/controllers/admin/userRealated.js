const userModel = require("../../models/users/user.model");

exports.getAllUser = async (req, res) => {
    try {
        const { name, email, phone, termsAccepted, startDate, endDate } = req.query;

        let filter = {};

        if (name) filter.name = { $regex: name, $options: 'i' };
        if (email) filter.email = { $regex: email, $options: 'i' };
        if (phone) filter.phone = { $regex: phone, $options: 'i' };
        if (termsAccepted) filter.termsAccepted = termsAccepted === 'true';


        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const users = await userModel.find(filter).select('-password -userAgent');

        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, message: 'No users found' });
        }

        res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: error });
    }
};





exports.getSingleUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id).select('-password -userAgent');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await userModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password -userAgent');

    if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await userModel.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
