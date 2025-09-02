import CustomEvent from "../modals/customEvents.model.js";

// Helper function to parse form data with array notation
const parseFormFields = (body) => {
  const fields = [];
  const fieldKeys = Object.keys(body).filter(key => key.startsWith('formFields[') || key.startsWith('eventFormFields['));
  
  if (fieldKeys.length === 0) {
    return body.formFields || body.eventFormFields;
  }

  // Group by field index
  const fieldGroups = {};
  fieldKeys.forEach(key => {
    const match = key.match(/(?:formFields|eventFormFields)\[(\d+)\]\[(\w+)\]/);
    if (match) {
      const [, index, property] = match;
      if (!fieldGroups[index]) {
        fieldGroups[index] = {};
      }
      fieldGroups[index][property] = body[key];
    }
  });

  // Convert to array
  Object.keys(fieldGroups).forEach(index => {
    const field = fieldGroups[index];
    
    // Parse options if it's a string
    if (field.options && typeof field.options === 'string') {
      try {
        field.options = JSON.parse(field.options);
      } catch (e) {
        // If parsing fails, keep as string
      }
    }
    
    // Parse validation if it's a string
    if (field.validation && typeof field.validation === 'string') {
      try {
        field.validation = JSON.parse(field.validation);
      } catch (e) {
        // If parsing fails, keep as string
      }
    }
    
    // Convert required to boolean
    if (field.required !== undefined) {
      field.required = field.required === 'true' || field.required === true;
    }
    
    fields.push(field);
  });

  return fields;
};

       // Create a new custom event template (ADMIN ONLY)
       const createCustomEvent = async (req, res) => {
         try {
           const { eventType, selectedTemplate, template, templateName } = req.body;
           
           // Use selectedTemplate or template (for backward compatibility)
           const templateToUse = selectedTemplate || template;

    // Parse form fields from request body
    const fieldsToUse = parseFormFields(req.body);

               if (!eventType || !templateToUse || !templateName || !fieldsToUse) {
             return res.status(400).json({
               error: "All required fields must be provided",
               missing: {
                 eventType: !eventType,
                 selectedTemplate: !templateToUse,
                 templateName: !templateName,
                 formFields: !fieldsToUse
               }
             });
           }

    if (!Array.isArray(fieldsToUse) || fieldsToUse.length === 0) {
      return res.status(400).json({ 
        error: "Event form fields must be an array and cannot be empty",
        received: typeof fieldsToUse,
        length: Array.isArray(fieldsToUse) ? fieldsToUse.length : 'not an array'
      });
    }

    // Process uploaded images for theme cards
    if (req.files && req.files.length > 0) {
      const uploadedFiles = req.files;
      
      // Update fieldsToUse with uploaded image URLs and base64
      fieldsToUse.forEach((field, fieldIndex) => {
        if (field.type === 'themeCards' && field.options && Array.isArray(field.options)) {
          field.options.forEach((option, optionIndex) => {
            // Find corresponding uploaded file for this theme card
            const fileKey = `themeCard_${fieldIndex}_${optionIndex}`;
            const uploadedFile = uploadedFiles.find(file => file.fieldname === fileKey);
            
            if (uploadedFile) {
              option.image = uploadedFile.location; // S3 URL
              option.imageBase64 = uploadedFile.preview; // Base64 encoded image
            }
          });
        }
      });
    }

               const customEvent = await CustomEvent.create({
             eventType,
             selectedTemplate: templateToUse, // Save as selectedTemplate in database
             templateName,
             eventFormFields: fieldsToUse, // Always save as eventFormFields in the database
             createdBy: req.user._id
           });

    return res.status(201).json({
      success: true,
      message: "Custom event template created successfully",
      data: customEvent
    });
  } catch (error) {
    console.error("Error creating custom event:", error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validationErrors 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: "A template with this name already exists" 
      });
    }
    
    return res.status(500).json({ error: "Something went wrong while creating custom event template" });
  }
};

// Update theme card image (ADMIN ONLY)
const updateThemeCardImage = async (req, res) => {
  try {
    const { templateId, fieldIndex, optionIndex } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    const customEvent = await CustomEvent.findById(templateId);
    if (!customEvent || customEvent.isDeleted === true) {
      return res.status(404).json({ error: "Custom event template not found" });
    }

    // Check if user has admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can update theme card images" });
    }

    const field = customEvent.eventFormFields[fieldIndex];
    if (!field || field.type !== 'themeCards') {
      return res.status(400).json({ error: "Invalid field index or field type" });
    }

    const option = field.options[optionIndex];
    if (!option) {
      return res.status(400).json({ error: "Invalid option index" });
    }

    // Update the image URL and base64 with the new uploaded image
    const uploadedFile = req.files[0];
    option.image = uploadedFile.location; // S3 URL
    option.imageBase64 = uploadedFile.preview; // Base64 encoded image

    // Update metadata
    customEvent.metadata.lastModified = new Date();
    customEvent.metadata.version = (parseFloat(customEvent.metadata.version) + 0.1).toFixed(1);

    await customEvent.save();

    return res.status(200).json({
      success: true,
      message: "Theme card image updated successfully",
      data: { 
        imageUrl: uploadedFile.location, // S3 URL
        imageBase64: uploadedFile.preview, // Base64 encoded image
        themeName: option.name,
        fieldIndex,
        optionIndex
      }
    });
  } catch (error) {
    console.error("Error updating theme card image:", error);
    return res.status(500).json({ error: "Something went wrong while updating theme card image" });
  }
};

// Get all custom event templates (with pagination and filters) - USERS can view active templates, ADMINS can view all
const getAllCustomEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, eventType, isActive, search } = req.query;
    
    const query = {};
    
    if (eventType) query.eventType = eventType;
    
    // Always exclude deleted templates (handle both existing and new records)
    query.$or = [
      { isDeleted: false },
      { isDeleted: { $exists: false } }
    ];
    
    // By default, show only active templates for all users
    // Admins can optionally see all templates by passing isActive=false
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    } else {
      query.isActive = true; // Default to active only
    }
    
    if (search) {
      query.$or = [
        { templateName: { $regex: search, $options: 'i' } },
        { selectedTemplate: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [customEvents, total] = await Promise.all([
      CustomEvent.find(query)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CustomEvent.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      message: "Custom events retrieved successfully",
      data: {
        customEvents,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error("Error getting custom events:", error);
    return res.status(500).json({ error: "Something went wrong while retrieving custom events" });
  }
};

// Get custom event template by ID - USERS can view active templates, ADMINS can view all
const getCustomEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const customEvent = await CustomEvent.findById(id)
      .populate('createdBy', 'name email');

    if (!customEvent || customEvent.isDeleted === true) {
      return res.status(404).json({ error: "Custom event template not found" });
    }

    // Users can only view active templates
    if (req.user.role !== 'admin' && !customEvent.isActive) {
      return res.status(404).json({ error: "Custom event template not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Custom event template retrieved successfully",
      data: customEvent
    });
  } catch (error) {
    console.error("Error getting custom event by ID:", error);
    return res.status(500).json({ error: "Something went wrong while retrieving custom event template" });
  }
};

// Update custom event template - ADMINS can update any, USERS cannot update
const updateCustomEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Only admins can update templates
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can update custom event templates" });
    }

    // Remove fields that shouldn't be updated
    delete updateData.createdBy;
    delete updateData._id;

    const customEvent = await CustomEvent.findById(id);

    if (!customEvent || customEvent.isDeleted === true) {
      return res.status(404).json({ error: "Custom event template not found" });
    }

    // Update metadata
    updateData.metadata = {
      version: (parseFloat(customEvent.metadata.version) + 0.1).toFixed(1),
      lastModified: new Date()
    };

    const updatedEvent = await CustomEvent.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    return res.status(200).json({
      success: true,
      message: "Custom event template updated successfully",
      data: updatedEvent
    });
  } catch (error) {
    console.error("Error updating custom event:", error);
    return res.status(500).json({ error: "Something went wrong while updating custom event template" });
  }
};

// Toggle active status of custom event template - ADMINS only
const toggleActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admins can toggle active status
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can toggle active status of custom event templates" });
    }

    const customEvent = await CustomEvent.findById(id);

    if (!customEvent || customEvent.isDeleted === true) {
      return res.status(404).json({ error: "Custom event template not found" });
    }

    // Toggle the active status
    customEvent.isActive = !customEvent.isActive;
    customEvent.metadata.lastModified = new Date();
    await customEvent.save();

    return res.status(200).json({
      success: true,
      message: `Custom event template ${customEvent.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: customEvent._id,
        templateName: customEvent.templateName,
        isActive: customEvent.isActive
      }
    });
  } catch (error) {
    console.error("Error toggling active status:", error);
    return res.status(500).json({ error: "Something went wrong while toggling active status" });
  }
};

// Delete custom event template (soft delete) - ADMINS only
const deleteCustomEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admins can delete templates
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can delete custom event templates" });
    }

    const customEvent = await CustomEvent.findById(id);

    if (!customEvent || customEvent.isDeleted === true) {
      return res.status(404).json({ error: "Custom event template not found" });
    }

    // Soft delete using isDeleted flag
    customEvent.isDeleted = true;
    customEvent.metadata.lastModified = new Date();
    await customEvent.save();

    return res.status(200).json({
      success: true,
      message: "Custom event template deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting custom event:", error);
    return res.status(500).json({ error: "Something went wrong while deleting custom event template" });
  }
};

// Get custom events by event type - USERS can view active templates, ADMINS can view all
const getCustomEventsByType = async (req, res) => {
  try {
    const { eventType } = req.params;
    const { isActive = true } = req.query;

    const query = { eventType };
    
    // Always exclude deleted templates (handle both existing and new records)
    query.$or = [
      { isDeleted: false },
      { isDeleted: { $exists: false } }
    ];
    
    // By default, show only active templates for all users
    // Admins can optionally see all templates by passing isActive=false
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    } else {
      query.isActive = true; // Default to active only
    }

    const customEvents = await CustomEvent.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: `Custom events for ${eventType} retrieved successfully`,
      data: customEvents
    });
  } catch (error) {
    console.error("Error getting custom events by type:", error);
    return res.status(500).json({ error: "Something went wrong while retrieving custom events by type" });
  }
};

// Validate form data against a template - USERS and ADMINS can validate
const validateFormData = async (req, res) => {
  try {
    const { templateId, formData } = req.body;

    if (!templateId || !formData) {
      return res.status(400).json({ error: "Template ID and form data are required" });
    }

    const customEvent = await CustomEvent.findById(templateId);

    if (!customEvent || customEvent.isDeleted === true) {
      return res.status(404).json({ error: "Custom event template not found" });
    }

    // Users can only validate against active templates
    if (req.user.role !== 'admin' && !customEvent.isActive) {
      return res.status(404).json({ error: "Custom event template not found" });
    }

    const validationErrors = customEvent.validateFormData(formData);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Form validation failed",
        data: { errors: validationErrors }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Form data is valid",
      data: { isValid: true }
    });
  } catch (error) {
    console.error("Error validating form data:", error);
    return res.status(500).json({ error: "Something went wrong while validating form data" });
  }
};

// Get template statistics - ADMINS only
const getTemplateStats = async (req, res) => {
  try {
    // Only admins can view statistics
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can view template statistics" });
    }

    const stats = await CustomEvent.aggregate([
      {
        $match: { 
          $or: [
            { isDeleted: false },
            { isDeleted: { $exists: false } }
          ]
        } // Exclude deleted templates
      },
      {
        $group: {
          _id: "$eventType",
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ["$isActive", 1, 0] }
          }
        }
      },
      {
        $project: {
          eventType: "$_id",
          totalTemplates: "$count",
          activeTemplates: "$activeCount",
          inactiveTemplates: { $subtract: ["$count", "$activeCount"] }
        }
      }
    ]);

    const totalTemplates = await CustomEvent.countDocuments({ 
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });
    const activeTemplates = await CustomEvent.countDocuments({ 
      isActive: true,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    });

    return res.status(200).json({
      success: true,
      message: "Template statistics retrieved successfully",
      data: {
        totalTemplates,
        activeTemplates,
        inactiveTemplates: totalTemplates - activeTemplates,
        byEventType: stats
      }
    });
  } catch (error) {
    console.error("Error getting template stats:", error);
    return res.status(500).json({ error: "Something went wrong while retrieving template statistics" });
  }
};

// Get theme card images from a template - USERS can view active templates, ADMINS can view all
const getThemeCardImages = async (req, res) => {
  try {
    const { id, format } = req.params;

    const customEvent = await CustomEvent.findById(id);
    if (!customEvent || customEvent.isDeleted === true) {
      return res.status(404).json({ error: "Custom event template not found" });
    }

    // Users can only view active templates
    if (req.user.role !== 'admin' && !customEvent.isActive) {
      return res.status(404).json({ error: "Custom event template not found" });
    }

    if (!customEvent.hasThemeCards()) {
      return res.status(200).json({
        success: true,
        message: "No theme cards found in this template",
        data: { images: [] }
      });
    }

    // Get images in specified format or both by default
    const themeCardImages = format ? 
      customEvent.getThemeCardImagesByFormat(format) : 
      customEvent.getThemeCardImages();

    const formatInfo = format ? ` in ${format.toUpperCase()} format` : ' in both formats';
    
    return res.status(200).json({
      success: true,
      message: `Theme card images retrieved successfully${formatInfo}`,
      data: {
        templateName: customEvent.templateName,
        eventType: customEvent.eventType,
        totalThemeCards: customEvent.getThemeCardCount(),
        images: themeCardImages,
        format: format || 'both',
        note: format ? `Images returned in ${format.toUpperCase()} format only` : "Each image contains both S3 URL (imageUrl) and base64 (imageBase64) for flexibility"
      }
    });
  } catch (error) {
    console.error("Error getting theme card images:", error);
    return res.status(500).json({ error: "Something went wrong while retrieving theme card images" });
  }
};

// ===== PUBLIC ACCESS ROUTES (NO AUTHENTICATION REQUIRED) =====

// Get all active custom events for public access (no authentication required)
const getPublicActiveEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, eventType, search } = req.query;
    
    const query = { isActive: true, isDeleted: false }; // Only active and non-deleted templates
    
    if (eventType) query.eventType = eventType;
    if (search) {
      query.$or = [
        { templateName: { $regex: search, $options: 'i' } },
        { selectedTemplate: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [customEvents, total] = await Promise.all([
      CustomEvent.find(query)
        .select('-createdBy -metadata -isActive -__v') // Don't expose sensitive fields
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CustomEvent.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      message: "Active custom events retrieved successfully",
      data: {
        customEvents,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error("Error getting public active events:", error);
    return res.status(500).json({ error: "Something went wrong while retrieving active events" });
  }
};

// Get public custom event template by ID (no authentication required)
const getPublicEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const customEvent = await CustomEvent.findById(id)
      .select('-createdBy -metadata -isActive -__v'); // Don't expose sensitive fields

    if (!customEvent) {
      return res.status(404).json({ error: "Custom event template not found" });
    }

    // Only return active and non-deleted templates
    if (!customEvent.isActive || customEvent.isDeleted) {
      return res.status(404).json({ error: "Custom event template not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Custom event template retrieved successfully",
      data: customEvent
    });
  } catch (error) {
    console.error("Error getting public event by ID:", error);
    return res.status(500).json({ error: "Something went wrong while retrieving custom event template" });
  }
};

// Get public custom events by event type (no authentication required)
const getPublicEventsByType = async (req, res) => {
  try {
    const { eventType } = req.params;
    const { page = 1, limit = 10, search } = req.query;

    const query = { eventType, isActive: true, isDeleted: false }; // Only active and non-deleted templates
    
    if (search) {
      query.$or = [
        { templateName: { $regex: search, $options: 'i' } },
        { selectedTemplate: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [customEvents, total] = await Promise.all([
      CustomEvent.find(query)
        .select('-createdBy -metadata -isActive -__v') // Don't expose sensitive fields
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CustomEvent.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      message: `Active custom events for ${eventType} retrieved successfully`,
      data: {
        customEvents,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error("Error getting public events by type:", error);
    return res.status(500).json({ error: "Something went wrong while retrieving custom events by type" });
  }
};

// Get all active event names for user selection (no authentication required)
const getActiveEventNames = async (req, res) => {
  try {
    const { eventType } = req.query;
    
    const query = { 
      isActive: true,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    };
    
    if (eventType) {
      query.eventType = eventType;
    }

    const customEvents = await CustomEvent.find(query)
      .select('_id templateName eventType selectedTemplate') // Only return essential fields
      .sort({ templateName: 1 }); // Sort alphabetically by template name

    return res.status(200).json({
      success: true,
      message: "Active event names retrieved successfully",
      data: {
        events: customEvents.map(event => ({
          _id: event._id,
          templateName: event.templateName,
          eventType: event.eventType,
          selectedTemplate: event.selectedTemplate
        })),
        totalCount: customEvents.length
      }
    });
  } catch (error) {
    console.error("Error getting active event names:", error);
    return res.status(500).json({ error: "Something went wrong while retrieving active event names" });
  }
};

// Get event details by ID for user selection (no authentication required)
const getEventDetailsById = async (req, res) => {
  try {
    const { id } = req.params;

    const customEvent = await CustomEvent.findById(id)
      .select('-createdBy -metadata -isActive -__v'); // Don't expose sensitive fields

    if (!customEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Only return active and non-deleted events
    if (!customEvent.isActive || customEvent.isDeleted) {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Event details retrieved successfully",
      data: {
        _id: customEvent._id,
        templateName: customEvent.templateName,
        eventType: customEvent.eventType,
        selectedTemplate: customEvent.selectedTemplate,
        eventFormFields: customEvent.eventFormFields,
        createdAt: customEvent.createdAt
      }
    });
  } catch (error) {
    console.error("Error getting event details by ID:", error);
    return res.status(500).json({ error: "Something went wrong while retrieving event details" });
  }
};

export {
  createCustomEvent,
  updateThemeCardImage,
  getAllCustomEvents,
  getCustomEventById,
  updateCustomEvent,
  toggleActiveStatus,
  deleteCustomEvent,
  getCustomEventsByType,
  validateFormData,
  getTemplateStats,
  getThemeCardImages,
  getPublicActiveEvents,
  getPublicEventById,
  getPublicEventsByType,
  getActiveEventNames,
  getEventDetailsById
};
