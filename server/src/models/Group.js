const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [120, 'Group name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1500, 'Description cannot exceed 1500 characters'],
    },
    joinCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [4, 'Join code must be at least 4 characters'],
      maxlength: [12, 'Join code cannot exceed 12 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: [],
    }],
    pendingMembers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      default: [],
    }],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

groupSchema.index({ createdBy: 1, status: 1 });

groupSchema.methods.toSummary = function () {
  return {
    _id: this._id,
    name: this.name,
    description: this.description,
    joinCode: this.joinCode,
    createdBy: this.createdBy,
    status: this.status,
    members: this.members || [],
    createdAt: this.createdAt,
    isActive: this.isActive,
  };
};

module.exports = mongoose.model('Group', groupSchema);
