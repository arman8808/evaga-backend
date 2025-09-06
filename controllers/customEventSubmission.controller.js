import CustomEventSubmission from "../modals/customEventSubmission.model.js";
import CustomEvent from "../modals/customEvents.model.js";
import { sendEmail } from "../utils/emailService.js";

// Helper function to clean form data for email display
const cleanFormDataForEmail = (formData) => {
  const cleanedData = {};
  
  // Define the fields we want to show in the admin email (original field names)
  const displayFields = [
    'eventType', 'ageGroup', 'birthdayDate', 'guestCount', 'mobileNumber', 
    'email', 'themeCards', 'budget', 'foodMenu', 'specialRequirements'
  ];
  
  // Only include the original field names, not the mapped ones with timestamps
  displayFields.forEach(field => {
    if (formData[field] !== undefined && formData[field] !== null && formData[field] !== '') {
      cleanedData[field] = formData[field];
    }
  });
  
  // Format specific fields for better display
  if (cleanedData.foodMenu && typeof cleanedData.foodMenu === 'object') {
    // Format food menu for better readability
    cleanedData.foodMenu = {
      dietaryType: cleanedData.foodMenu.dietaryType,
      courses: cleanedData.foodMenu.courses,
      foodItems: cleanedData.foodMenu.foodItems
    };
  }
  
  return cleanedData;
};

// Helper function to map form data keys to field IDs
const mapFormDataToFieldIds = (formData, eventFormFields) => {
  const mappedData = {};
  
  // Create a mapping from common field names to field IDs
  const fieldMapping = {
    'ageGroup': 'ageGroup',
    'birthdayDate': 'birthdayDate', 
    'budget': 'budget',
    'email': 'email',
    'eventType': 'eventType',
    'foodMenu': 'foodMenu',
    'guestCount': 'guestCount',
    'mobileNumber': 'mobileNumber',
    'phone': 'mobileNumber',
    'specialRequirements': 'specialRequirements',
    'requirements': 'specialRequirements',
    'themeCards': 'themeCards',
    'theme': 'themeCards',
    'date': 'birthdayDate',
    'eventDate': 'birthdayDate'
  };
  
  // First, try to map using the field mapping
  Object.keys(formData).forEach(key => {
    const mappedKey = fieldMapping[key] || key;
    mappedData[mappedKey] = formData[key];
  });
  
  // Then, try to match with actual field IDs from the template
  eventFormFields.forEach(field => {
    // If we don't have this field ID in our mapped data, try to find it by label matching
    if (!mappedData[field.id]) {
      const labelLower = field.label.toLowerCase();
      
      // Try to match by common patterns in labels
      if (labelLower.includes('age') && formData.ageGroup) {
        mappedData[field.id] = formData.ageGroup;
      } else if (labelLower.includes('birthday') && formData.birthdayDate) {
        mappedData[field.id] = formData.birthdayDate;
      } else if (labelLower.includes('budget') && formData.budget) {
        mappedData[field.id] = formData.budget;
      } else if (labelLower.includes('email') && formData.email) {
        mappedData[field.id] = formData.email;
      } else if (labelLower.includes('guest') && formData.guestCount) {
        mappedData[field.id] = formData.guestCount;
      } else if ((labelLower.includes('mobile') || labelLower.includes('phone')) && (formData.mobileNumber || formData.phone)) {
        mappedData[field.id] = formData.mobileNumber || formData.phone;
      } else if (labelLower.includes('theme') && formData.themeCards) {
        mappedData[field.id] = formData.themeCards;
      } else if (labelLower.includes('requirement') && formData.specialRequirements) {
        mappedData[field.id] = formData.specialRequirements;
      } else if (labelLower.includes('food') && formData.foodMenu) {
        mappedData[field.id] = formData.foodMenu;
      }
    }
  });
  
  return mappedData;
};

// Submit a custom event form (PUBLIC - no authentication required)
const submitCustomEventForm = async (req, res) => {
  try {
    const { customEventId, formData } = req.body;

    // Validate required fields
    if (!customEventId || !formData) {
      return res.status(400).json({
        error: "Custom event ID and form data are required"
      });
    }

    // Check if the custom event template exists and is active
    const customEvent = await CustomEvent.findById(customEventId);
    if (!customEvent || customEvent.isDeleted || !customEvent.isActive) {
      return res.status(404).json({
        error: "Custom event template not found or inactive"
      });
    }

    // Map form data keys to field IDs for validation
    const mappedFormData = mapFormDataToFieldIds(formData, customEvent.eventFormFields);
    
    // Validate form data against the template
    const validationErrors = customEvent.validateFormData(mappedFormData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Form validation failed",
        details: validationErrors
      });
    }

    // Create submission
    const submission = await CustomEventSubmission.create({
      customEventId,
      userId: req.user?._id || null, // Optional user ID if authenticated
      formData: mappedFormData, // Use mapped form data
      eventType: customEvent.eventType,
      templateName: customEvent.templateName,
      contactInfo: {
        email: formData.email || "",
        mobileNumber: formData.mobileNumber || formData.phone || ""
      },
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress || "",
        userAgent: req.get('User-Agent') || ""
      }
    });

    // Send response immediately to frontend
    res.status(201).json({
      success: true,
      message: "Custom event form submitted successfully",
      data: {
        submissionId: submission._id,
        eventType: submission.eventType,
        templateName: submission.templateName,
        status: submission.status,
        submittedAt: submission.createdAt
      }
    });

    // Send emails asynchronously after response is sent
    setImmediate(async () => {
      try {
        // Send confirmation email to user
        await sendEmail(
          "customEventSubmissionUser",
          formData.email,
          "🎉 Your Custom Event Request Has Been Submitted - Eevagga",
          {
            eventType: submission.eventType,
            templateName: submission.templateName,
            eventDate: submission.eventDetails.eventDate,
            guestCount: submission.eventDetails.guestCount,
            budget: submission.eventDetails.budget,
            theme: submission.eventDetails.theme
          }
        );

        // Clean and format form data for admin email
        const cleanFormData = cleanFormDataForEmail(submission.formData);
        
        // Send notification email to admin
        await sendEmail(
          "customEventSubmissionAdmin",
          "info@evagaentertainment.com",
          "📋 New Custom Event Submission - Action Required",
          {
            submissionId: submission._id,
            eventType: submission.eventType,
            templateName: submission.templateName,
            contactEmail: submission.contactInfo.email,
            contactPhone: submission.contactInfo.mobileNumber,
            submittedAt: submission.createdAt.toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            formData: cleanFormData
          }
        );

        console.log("Emails sent successfully for submission:", submission._id);
      } catch (emailError) {
        console.error("Error sending emails:", emailError);
        // Log error but don't affect the user experience
      }
    });
  } catch (error) {
    console.error("Error submitting custom event form:", error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validationErrors 
      });
    }
    
    return res.status(500).json({ 
      error: "Something went wrong while submitting the form" 
    });
  }
};

// Get all custom event submissions (ADMIN only)
const getAllSubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, eventType, search } = req.query;
    
    // Only admins can view all submissions
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        error: "Only admins can view all submissions" 
      });
    }

    const query = { isDeleted: false };
    
    if (status) query.status = status;
    if (eventType) query.eventType = eventType;
    
    if (search) {
      query.$or = [
        { templateName: { $regex: search, $options: 'i' } },
        { eventType: { $regex: search, $options: 'i' } },
        { 'contactInfo.email': { $regex: search, $options: 'i' } },
        { 'contactInfo.mobileNumber': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [submissions, total] = await Promise.all([
      CustomEventSubmission.find(query)
        .populate('customEventId', 'templateName eventType')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CustomEventSubmission.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      message: "Custom event submissions retrieved successfully",
      data: {
        submissions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error("Error getting custom event submissions:", error);
    return res.status(500).json({ 
      error: "Something went wrong while retrieving submissions" 
    });
  }
};

// Get submission by ID (ADMIN only)
const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admins can view individual submissions
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        error: "Only admins can view submissions" 
      });
    }

    const submission = await CustomEventSubmission.findById(id)
      .populate('customEventId', 'templateName eventType eventFormFields')
      .populate('userId', 'name email');

    if (!submission || submission.isDeleted) {
      return res.status(404).json({ 
        error: "Submission not found" 
      });
    }

    return res.status(200).json({
      success: true,
      message: "Submission retrieved successfully",
      data: submission
    });
  } catch (error) {
    console.error("Error getting submission by ID:", error);
    return res.status(500).json({ 
      error: "Something went wrong while retrieving submission" 
    });
  }
};

// Update submission status (ADMIN only)
const updateSubmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    // Only admins can update submission status
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        error: "Only admins can update submission status" 
      });
    }

    const validStatuses = ['pending', 'reviewed', 'approved', 'rejected', 'in_progress', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Valid status is required",
        validStatuses
      });
    }

    const submission = await CustomEventSubmission.findById(id);
    if (!submission || submission.isDeleted) {
      return res.status(404).json({ 
        error: "Submission not found" 
      });
    }

    await submission.updateStatus(status, adminNotes);

    return res.status(200).json({
      success: true,
      message: "Submission status updated successfully",
      data: {
        id: submission._id,
        status: submission.status,
        adminNotes: submission.adminNotes,
        lastModified: submission.metadata.lastModified
      }
    });
  } catch (error) {
    console.error("Error updating submission status:", error);
    return res.status(500).json({ 
      error: "Something went wrong while updating submission status" 
    });
  }
};

// Get submissions by status (ADMIN only)
const getSubmissionsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Only admins can view submissions by status
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        error: "Only admins can view submissions by status" 
      });
    }

    const validStatuses = ['pending', 'reviewed', 'approved', 'rejected', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status",
        validStatuses
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [submissions, total] = await Promise.all([
      CustomEventSubmission.find({ status, isDeleted: false })
        .populate('customEventId', 'templateName eventType')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CustomEventSubmission.countDocuments({ status, isDeleted: false })
    ]);

    return res.status(200).json({
      success: true,
      message: `Submissions with status '${status}' retrieved successfully`,
      data: {
        submissions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error("Error getting submissions by status:", error);
    return res.status(500).json({ 
      error: "Something went wrong while retrieving submissions by status" 
    });
  }
};

// Get submission statistics (ADMIN only)
const getSubmissionStats = async (req, res) => {
  try {
    // Only admins can view statistics
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        error: "Only admins can view submission statistics" 
      });
    }

    const stats = await CustomEventSubmission.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          statusCounts: {
            $push: {
              status: "$_id",
              count: "$count"
            }
          },
          total: { $sum: "$count" }
        }
      }
    ]);

    // Get additional statistics
    const totalSubmissions = await CustomEventSubmission.countDocuments({ isDeleted: false });
    const pendingSubmissions = await CustomEventSubmission.countDocuments({ 
      status: 'pending', 
      isDeleted: false 
    });
    const recentSubmissions = await CustomEventSubmission.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      isDeleted: false
    });

    // Get submissions by event type
    const eventTypeStats = await CustomEventSubmission.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$eventType",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return res.status(200).json({
      success: true,
      message: "Submission statistics retrieved successfully",
      data: {
        totalSubmissions,
        pendingSubmissions,
        recentSubmissions,
        statusBreakdown: stats[0]?.statusCounts || [],
        eventTypeBreakdown: eventTypeStats
      }
    });
  } catch (error) {
    console.error("Error getting submission stats:", error);
    return res.status(500).json({ 
      error: "Something went wrong while retrieving submission statistics" 
    });
  }
};

// Delete submission (soft delete) (ADMIN only)
const deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admins can delete submissions
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        error: "Only admins can delete submissions" 
      });
    }

    const submission = await CustomEventSubmission.findById(id);
    if (!submission || submission.isDeleted) {
      return res.status(404).json({ 
        error: "Submission not found" 
      });
    }

    // Soft delete
    submission.isDeleted = true;
    submission.metadata.lastModified = new Date();
    await submission.save();

    return res.status(200).json({
      success: true,
      message: "Submission deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting submission:", error);
    return res.status(500).json({ 
      error: "Something went wrong while deleting submission" 
    });
  }
};

// Get submissions needing attention (ADMIN only)
const getSubmissionsNeedingAttention = async (req, res) => {
  try {
    // Only admins can view submissions needing attention
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        error: "Only admins can view submissions needing attention" 
      });
    }

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const submissions = await CustomEventSubmission.find({
      status: 'pending',
      createdAt: { $lt: threeDaysAgo },
      isDeleted: false
    })
      .populate('customEventId', 'templateName eventType')
      .populate('userId', 'name email')
      .sort({ createdAt: 1 }); // Oldest first

    return res.status(200).json({
      success: true,
      message: "Submissions needing attention retrieved successfully",
      data: {
        submissions,
        count: submissions.length,
        message: `${submissions.length} submissions have been pending for more than 3 days`
      }
    });
  } catch (error) {
    console.error("Error getting submissions needing attention:", error);
    return res.status(500).json({ 
      error: "Something went wrong while retrieving submissions needing attention" 
    });
  }
};

export {
  submitCustomEventForm,
  getAllSubmissions,
  getSubmissionById,
  updateSubmissionStatus,
  getSubmissionsByStatus,
  getSubmissionStats,
  deleteSubmission,
  getSubmissionsNeedingAttention
};
