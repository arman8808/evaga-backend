const calculateProfileCompletion = (vendor) => {
  const totalFields = 11;
  let filledFields = 0;
  if (vendor.venderID) filledFields++;
  if (vendor.email) filledFields++;
  if (vendor.phoneNumber) filledFields++;
  if (vendor.name) filledFields++;
  if (vendor.businessDetails) filledFields++;
  if (vendor.bio) filledFields++;
  if (vendor.profilePicture) filledFields++;
  if (vendor.bankDetails) filledFields++;
  if (vendor.businessDetails) {
    const {
      adharVerificationStatus,
      gstVerificationStatus,
      panVerificationStatus,
    } = vendor.businessDetails;
    filledFields += [
      adharVerificationStatus,
      gstVerificationStatus,
      panVerificationStatus,
    ].filter((status) => status === "Verified").length;
  }
  const completionPercentage = Math.round((filledFields / totalFields) * 100);
  return completionPercentage;
};

export { calculateProfileCompletion };
