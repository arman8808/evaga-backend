import mongoose from "mongoose";

const validationSchema = new mongoose.Schema({
  min: { type: String, default: "" },
  max: { type: String, default: "" },
  pattern: { type: String, default: "" }
}, { _id: false });

const themeCardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true }, // S3 URL
  imageBase64: { type: String, required: true }, // Base64 encoded image
  description: { type: String, required: true }
}, { _id: false });

const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: String, required: true },
  description: { type: String, required: true },
  dietaryType: { 
    type: String, 
    enum: ['veg', 'non-veg', 'seafood', 'vegan'], 
    required: true 
  },
  spiceLevel: { 
    type: String, 
    enum: ['mild', 'medium', 'hot'], 
    required: true 
  },
  isPopular: { type: Boolean, default: false }
}, { _id: false });

const foodCategorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true },
  items: [foodItemSchema]
}, { _id: false });

const eventFormFieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  label: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['select', 'date', 'themeCards', 'number', 'text', 'foodMenu', 'textarea', 'phone', 'email']
  },
  required: { type: Boolean, default: false },
  placeholder: { type: String, default: "" },
  options: { type: mongoose.Schema.Types.Mixed, default: [] }, // Can be array of strings or complex objects
  validation: { type: validationSchema, default: () => ({}) }
}, { _id: false });

const customEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true
  },
  selectedTemplate: {
    type: String,
    required: true
  },
  templateName: {
    type: String,
    required: true
  },
  eventFormFields: [eventFormFieldSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  metadata: {
    version: { type: String, default: "1.0" },
    lastModified: { type: Date, default: Date.now }
  }
}, { 
  timestamps: true,
  collection: "customEvents"
});

// Index for better query performance
customEventSchema.index({ eventType: 1, createdBy: 1 });
customEventSchema.index({ selectedTemplate: 1 });
customEventSchema.index({ isActive: 1 });
customEventSchema.index({ isDeleted: 1 });

// Virtual for getting field count
customEventSchema.virtual('fieldCount').get(function() {
  return this.eventFormFields ? this.eventFormFields.length : 0;
});

// Method to get required fields
customEventSchema.methods.getRequiredFields = function() {
  return this.eventFormFields.filter(field => field.required);
};

// Method to validate form data against schema
customEventSchema.methods.validateFormData = function(formData) {
  const errors = [];
  
  this.eventFormFields.forEach(field => {
    if (field.required && !formData[field.id]) {
      errors.push(`${field.label} is required`);
    }
    
    if (formData[field.id] && field.validation) {
      // Add validation logic here based on field type and validation rules
      if (field.validation.min && formData[field.id] < field.validation.min) {
        errors.push(`${field.label} must be at least ${field.validation.min}`);
      }
      
      if (field.validation.max && formData[field.id] > field.validation.max) {
        errors.push(`${field.label} must be at most ${field.validation.max}`);
      }
      
      if (field.validation.pattern && !new RegExp(field.validation.pattern).test(formData[field.id])) {
        errors.push(`${field.label} format is invalid`);
      }
    }
  });
  
  return errors;
};

// Method to get all theme card images from a template
customEventSchema.methods.getThemeCardImages = function() {
  const images = [];
  
  this.eventFormFields.forEach((field, fieldIndex) => {
    if (field.type === 'themeCards' && field.options && Array.isArray(field.options)) {
      field.options.forEach((option, optionIndex) => {
        if (option.image || option.imageBase64) {
          images.push({
            fieldIndex,
            optionIndex,
            themeName: option.name,
            imageUrl: option.image || null, // S3 URL
            imageBase64: option.imageBase64 || null, // Base64 encoded image
            description: option.description
          });
        }
      });
    }
  });
  
  return images;
};

// Method to check if template has theme cards
customEventSchema.methods.hasThemeCards = function() {
  return this.eventFormFields.some(field => field.type === 'themeCards');
};

// Method to get theme card field count
customEventSchema.methods.getThemeCardCount = function() {
  let count = 0;
  this.eventFormFields.forEach(field => {
    if (field.type === 'themeCards' && field.options) {
      count += field.options.length;
    }
  });
  return count;
};

// Method to get theme card images in a specific format
customEventSchema.methods.getThemeCardImagesByFormat = function(format = 'both') {
  const images = [];
  
  this.eventFormFields.forEach((field, fieldIndex) => {
    if (field.type === 'themeCards' && field.options && Array.isArray(field.options)) {
      field.options.forEach((option, optionIndex) => {
        if (option.image || option.imageBase64) {
          const imageData = {
            fieldIndex,
            optionIndex,
            themeName: option.name,
            description: option.description
          };
          
          switch (format) {
            case 's3':
              if (option.image) {
                imageData.imageUrl = option.image;
              }
              break;
            case 'base64':
              if (option.imageBase64) {
                imageData.imageBase64 = option.imageBase64;
              }
              break;
            default: // 'both'
              imageData.imageUrl = option.image || null;
              imageData.imageBase64 = option.imageBase64 || null;
          }
          
          images.push(imageData);
        }
      });
    }
  });
  
  return images;
};

export default mongoose.model("CustomEvent", customEventSchema);
