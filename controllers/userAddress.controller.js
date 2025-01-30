import User from "../modals/user.modal.js";
import userAddress from "../modals/address.modal.js";
const addAddress = async (req, res) => {
  try {
    const { userId } = req.params;
    const { Name, address, addressLine1, addressLine2, state, pinCode } =
      req.body;

    const userNewAddress = new userAddress({
      userId,
      Name,
      address,
      addressLine1,
      addressLine2,
      state,
      pinCode,
    });
    const savedAddress = await userNewAddress.save();
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.userAddresses.push(savedAddress._id);
    await user.save();

    res
      .status(201)
      .json({ message: "Address added successfully", address: savedAddress });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const getAllAddresses = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate("userAddresses");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ addresses: user.userAddresses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getOneAddresses = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await userAddress.findById(addressId);
    if (!user) return res.status(404).json({ error: "User Address not found" });

    res.status(200).json({ addresses: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { Name, address, addressLine1, addressLine2, state, pinCode } =
      req.body;
console.log(Name, address, addressLine1, addressLine2, state, pinCode);

    const existingAddress = await userAddress.findById(addressId);
    if (!existingAddress) {
      return res.status(404).json({ error: "Address not found" });
    }

    const updatedAddress = await userAddress.findByIdAndUpdate(
      addressId,
      {
        Name: Name || existingAddress.Name,
        address: address || existingAddress.address,
        addressLine1: addressLine1 || existingAddress.addressLine1,
        addressLine2: addressLine2 || existingAddress.addressLine2,
        state: state || existingAddress.state,
        pinCode: pinCode || existingAddress.pinCode,
      },
      { new: true }
    );

    res.status(200).json({
      message: "Address updated successfully",
      address: updatedAddress,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { addressId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.userAddresses = user.userAddresses.filter(
      (id) => id.toString() !== addressId
    );
    await user.save();

    const deletedAddress = await userAddress.findByIdAndDelete(addressId);
    if (!deletedAddress)
      return res.status(404).json({ error: "Address not found" });

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export {
  addAddress,
  getAllAddresses,
  updateAddress,
  deleteAddress,
  getOneAddresses,
};
