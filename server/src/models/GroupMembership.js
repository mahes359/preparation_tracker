const mongoose = require('mongoose');

const groupMembershipSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['CREATOR', 'MEMBER'],
      default: 'MEMBER',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'REJECTED', 'REMOVED'],
      default: 'PENDING',
      index: true,
    },
    joinedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Unique constraint: one membership per user per group
groupMembershipSchema.index({ userId: 1, groupId: 1 }, { unique: true });
groupMembershipSchema.index({ userId: 1, status: 1 });
groupMembershipSchema.index({ groupId: 1, status: 1 });

groupMembershipSchema.methods.toJSON = function () {
  return {
    _id: this._id,
    groupId: this.groupId,
    userId: this.userId,
    role: this.role,
    status: this.status,
    joinedAt: this.joinedAt,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('GroupMembership', groupMembershipSchema);
