const calculateProfileCompletion = (vendor) => {
  const totalFields = 12 + 9; // 13 base fields + 9 document fields
  let filledFields = 0;

  // Check base fields
  if (vendor.venderID) filledFields++;
  if (vendor.email) filledFields++;
  if (vendor.phoneNumber) filledFields++;
  if (vendor.password) filledFields++;
  if (vendor.name) filledFields++;
  if (vendor.documents && Array.isArray(vendor.documents)) {

    filledFields += vendor.documents.filter((doc) => doc).length;
  }
  if (vendor.alternatePhoneNumber) filledFields++;
  if (vendor.bio) filledFields++;
  if (vendor.location) filledFields++;
  if (vendor.areaOfInterest) filledFields++;
  if (vendor.yearOfExperience) filledFields++;
  if (vendor.profilePicture) filledFields++;
  if (vendor.bankDetails) filledFields++;


  const completionPercentage = Math.round((filledFields / totalFields) * 100);
  return completionPercentage;
};

export { calculateProfileCompletion };
