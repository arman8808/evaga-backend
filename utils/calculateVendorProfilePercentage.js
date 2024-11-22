const calculateProfileCompletion = (vendor) => {
  const totalFields = 12;
  let filledFields = 0;

  if (vendor.venderID) filledFields++;
  if (vendor.email) filledFields++;
  if (vendor.phoneNumber) filledFields++;
  if (vendor.password) filledFields++;
  if (vendor.name) filledFields++;

  if (vendor.alternatePhoneNumber) filledFields++;
  if (vendor.bio) filledFields++;
  if (vendor.location) filledFields++;
  if (vendor.areaOfInterest) filledFields++;
  if (vendor.yearOfExperience) filledFields++;
  if (vendor.profilePicture) filledFields++;
  if (vendor.bankDetails) filledFields++;

  console.log(
    vendor.venderID,
    " vendor.venderID,",
    vendor.email,
    " vendor.email,",
    vendor.phoneNumber,
    "  vendor.phoneNumber,",
    vendor.password,
    " vendor.password,",
    vendor.name,
    " vendor.name,",
    vendor.alternatePhoneNumber,
    "  vendor.alternatePhoneNumber,",
    vendor.bio,
    "    vendor.bio,",
    vendor.location,
    "vendor.location,",
    vendor.areaOfInterest,
    "   vendor.areaOfInterest,",
    vendor.yearOfExperience,
    "vendor.yearOfExperience,",
    vendor.profilePicture,
    "  vendor.profilePicture,",
    vendor.bankDetails,
    "    vendor.bankDetails"
  );

  const completionPercentage = Math.round((filledFields / totalFields) * 100);
  return completionPercentage;
};

export { calculateProfileCompletion };
