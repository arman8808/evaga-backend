import Vender from "../modals/vendor.modal.js";

export const generateUsername = async (name, date, VendorModel) => {
  const nameParts = name.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts[1] || "";

  const nameAbbreviation = (
    firstName.slice(0, 2) + lastName.slice(0, 2)
  ).toLowerCase();

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  const baseUsername = nameAbbreviation + month + year;

  const existingUsernames = await VendorModel.find({
    userName: { $regex: `^${baseUsername}` },
  }).select("userName");

  const usernameSet = new Set(
    existingUsernames.map((vendor) => vendor.userName)
  );

  let counter = 1;
  let username = baseUsername;

  while (usernameSet.has(username)) {
    username = baseUsername + counter;
    counter++;
  }

  return username;
};

export const updateVendors = async () => {
  try {
    const vendors = await Vender.find();
    console.log(vendors);

    for (const vendor of vendors) {
      if (!vendor.userName) {
        const date = vendor.createdAt || new Date();
        const username = await generateUsername(vendor.name, date, Vender);

        vendor.userName = username; // Ensure this matches your schema
        await vendor.save();
      }
    }

    console.log("Vendor usernames updated successfully!");
  } catch (err) {
    console.error("Error updating vendors:", err);
  }
};
