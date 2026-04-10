import mongoose from 'mongoose';

const systemSettingsSchema = mongoose.Schema(
  {
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    defaultAiModel: {
      type: String,
      default: 'llama-3.3-70b-versatile',
    },
    maxTokensPerReview: {
      type: Number,
      default: 4000,
    },
    registrationEnabled: {
      type: Boolean,
      default: true,
    },
    allowedEmails: [String], // For restricted registration
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

export default SystemSettings;
