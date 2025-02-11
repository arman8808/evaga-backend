import mongoose from "mongoose";

const userAddressModal = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  Name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  addressLine1: {
    type: String,
    required: true,
  },
  addressLine2: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  pinCode: {
    type: Number,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false, 
  },
});
const userAddress = mongoose.model("userAddress", userAddressModal);

export default userAddress;
