const calculateProfileCompletion = (vendor) => {
  const totalFields = 12;
  let filledFields = 0;

  if (vendor.venderID) filledFields++;
  if (vendor.email) filledFields++;
  if (vendor.phoneNumber) filledFields++;
  if (vendor.password) filledFields++;
  if (vendor.name) filledFields++;
  if (vendor.documents) filledFields++;

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
