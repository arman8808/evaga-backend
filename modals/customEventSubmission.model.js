import mongoose from "mongoose";

const customEventSubmissionSchema = new mongoose.Schema({
  // Reference to the custom event template
  customEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomEvent",
    required: true
  },
  
  // User who submitted the form (optional - for guest submissions)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  
  // Form submission data
  formData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Event type from the template
  eventType: {
    type: String,
    required: true
  },
  
  // Template name for reference
  templateName: {
    type: String,
    required: true
  },
  
  // Submission status
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'approved', 'rejected', 'in_progress', 'completed'],
    default: 'pending'
  },
  
  // Admin notes for the submission
  adminNotes: {
    type: String,
    default: ""
  },
  
  // Contact information extracted from form data
  contactInfo: {
    email: {
      type: String,
      required: true
    },
    mobileNumber: {
      type: String,
      required: true
    }
  },
  
  // Event details extracted from form data
  eventDetails: {
    eventDate: {
      type: Date,
      required: false
    },
    guestCount: {
      type: Number,
      required: false
    },
    budget: {
      type: String,
      required: false
    },
    theme: {
      type: String,
      required: false
    },
    specialRequirements: {
      type: String,
      required: false
    }
  },
  
  // Additional metadata
  metadata: {
    submissionVersion: { type: String, default: "1.0" },
    lastModified: { type: Date, default: Date.now },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" }
  },
  
  // Soft delete flag
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  // Archive flag for old submissions
  isArchived: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true,
  collection: "customEventSubmissions"
});

// Indexes for better query performance
customEventSubmissionSchema.index({ customEventId: 1, userId: 1 });
customEventSubmissionSchema.index({ userId: 1, status: 1 });
customEventSubmissionSchema.index({ eventType: 1, status: 1 });
customEventSubmissionSchema.index({ status: 1, createdAt: -1 });
customEventSubmissionSchema.index({ isDeleted: 1, isArchived: 1 });
customEventSubmissionSchema.index({ 'contactInfo.email': 1 });
customEventSubmissionSchema.index({ 'contactInfo.mobileNumber': 1 });

// Virtual for getting submission age in days
customEventSubmissionSchema.virtual('submissionAge').get(function() {
  const now = new Date();
  const submissionDate = this.createdAt;
  const diffTime = Math.abs(now - submissionDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to update status
customEventSubmissionSchema.methods.updateStatus = function(newStatus, adminNotes = "") {
  this.status = newStatus;
  if (adminNotes) {
    this.adminNotes = adminNotes;
  }
  this.metadata.lastModified = new Date();
  return this.save();
};

// Method to extract event details from form data
customEventSubmissionSchema.methods.extractEventDetails = function() {
  const formData = this.formData;
  
  // Extract common event details
  this.eventDetails = {
    eventDate: formData.birthdayDate || formData.eventDate || formData.date || null,
    guestCount: parseInt(formData.guestCount) || null,
    budget: formData.budget || null,
    theme: formData.themeCards || formData.theme || null,
    specialRequirements: formData.specialRequirements || formData.requirements || null
  };
  
  // Extract contact information
  this.contactInfo = {
    email: formData.email || "",
    mobileNumber: formData.mobileNumber || formData.phone || ""
  };
  
  // Don't save here - let the pre-save middleware handle it
  return this;
};

// Method to get formatted submission summary
customEventSubmissionSchema.methods.getSubmissionSummary = function() {
  return {
    id: this._id,
    eventType: this.eventType,
    templateName: this.templateName,
    status: this.status,
    contactEmail: this.contactInfo.email,
    contactPhone: this.contactInfo.mobileNumber,
    eventDate: this.eventDetails.eventDate,
    guestCount: this.eventDetails.guestCount,
    budget: this.eventDetails.budget,
    theme: this.eventDetails.theme,
    submittedAt: this.createdAt,
    lastModified: this.metadata.lastModified
  };
};

// Method to check if submission is recent (within last 7 days)
customEventSubmissionSchema.methods.isRecent = function() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return this.createdAt > sevenDaysAgo;
};

// Method to check if submission needs attention (pending for more than 3 days)
customEventSubmissionSchema.methods.needsAttention = function() {
  if (this.status !== 'pending') return false;
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  return this.createdAt < threeDaysAgo;
};

// Static method to get submissions by status
customEventSubmissionSchema.statics.getByStatus = function(status, options = {}) {
  const query = { status, isDeleted: false };
  if (options.userId) query.userId = options.userId;
  if (options.eventType) query.eventType = options.eventType;
  
  return this.find(query)
    .populate('customEventId', 'templateName eventType')
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get submission statistics
customEventSubmissionSchema.statics.getStatistics = function() {
  return this.aggregate([
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
};

// Pre-save middleware to extract event details
customEventSubmissionSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('formData')) {
    const formData = this.formData;
    
    // Extract common event details
    this.eventDetails = {
      eventDate: formData.birthdayDate || formData.eventDate || formData.date || null,
      guestCount: parseInt(formData.guestCount) || null,
      budget: formData.budget || null,
      theme: formData.themeCards || formData.theme || null,
      specialRequirements: formData.specialRequirements || formData.requirements || null
    };
    
    // Extract contact information
    this.contactInfo = {
      email: formData.email || "",
      mobileNumber: formData.mobileNumber || formData.phone || ""
    };
  }
  next();
});

// Pre-save middleware to update metadata
customEventSubmissionSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.metadata.lastModified = new Date();
  }
  next();
});

export default mongoose.model("CustomEventSubmission", customEventSubmissionSchema);
