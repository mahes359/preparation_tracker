const mongoose = require('mongoose');
const Group = require('../models/Group');
const { getAuth, isClerkConfigured } = require('./auth');
const Student = require('../models/Student');

const getCurrentStudent = async (req) => {
  if (!isClerkConfigured) {
    const fallbackStudentId = req.body?.studentId || req.query?.studentId || req.params?.studentId || null;
    if (fallbackStudentId) {
      return Student.findById(fallbackStudentId).lean({ virtuals: true });
    }
    return Student.findOne({ isActive: true }).sort({ createdAt: 1 }).lean({ virtuals: true });
  }

  const { userId } = getAuth(req);
  if (!userId) return null;
  return Student.findOne({ clerkId: userId, isActive: true }).lean({ virtuals: true });
};

const requireAuthStudent = async (req, res, next) => {
  try {
    const student = await getCurrentStudent(req);
    if (!student && isClerkConfigured) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    req.currentStudent = student || null;
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    const student = await getCurrentStudent(req);
    if (!student && isClerkConfigured) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!isClerkConfigured) {
      req.currentStudent = student || null;
      return next();
    }
    if (student.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    req.currentStudent = student;
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireGroupAccess = async (req, res, next) => {
  try {
    const student = await getCurrentStudent(req);
    if (!student && isClerkConfigured) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const groupId = req.params.groupId || req.params.id || req.body.groupId || req.query.groupId;
    if (!groupId) {
      req.currentStudent = student || null;
      return next();
    }

    if (!isClerkConfigured) {
      req.currentStudent = student || null;
      return next();
    }

    if (student.role === 'ADMIN') {
      req.currentStudent = student;
      return next();
    }

    const group = await Group.findOne({
      _id: mongoose.Types.ObjectId.isValid(groupId) ? groupId : null,
      isActive: true,
    }).lean();

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some((memberId) => memberId.toString() === student._id.toString());
    const isCreator = group.createdBy.toString() === student._id.toString();

    if (!isMember && !isCreator) {
      return res.status(403).json({ success: false, message: 'Access denied for this group' });
    }

    req.currentStudent = student;
    req.group = group;
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireGroupCreator = async (req, res, next) => {
  try {
    const student = await getCurrentStudent(req);
    if (!student && isClerkConfigured) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const groupId = req.params.groupId || req.params.id || req.body.groupId || req.query.groupId;
    if (!groupId) {
      if (!isClerkConfigured) {
        req.currentStudent = student || null;
        return next();
      }
      return res.status(400).json({ success: false, message: 'Group identifier required' });
    }

    if (!isClerkConfigured) {
      req.currentStudent = student || null;
      return next();
    }

    const group = await Group.findOne({
      _id: mongoose.Types.ObjectId.isValid(groupId) ? groupId : null,
      isActive: true,
    }).lean();

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (student.role !== 'ADMIN' && group.createdBy.toString() !== student._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only group creators can manage this group' });
    }

    req.currentStudent = student;
    req.group = group;
    return next();
  } catch (error) {
    return next(error);
  }
};

// Middleware to check that user has an active group membership
// If groupId is in the request, also verifies membership in that specific group
const requireActiveGroupMembership = async (req, res, next) => {
  try {
    const student = await getCurrentStudent(req);
    if (!student && isClerkConfigured) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!isClerkConfigured) {
      req.currentStudent = student || null;
      return next();
    }

    if (student.role === 'ADMIN') {
      req.currentStudent = student;
      return next();
    }

    if (!student.groupIds || student.groupIds.length === 0) {
      return res.status(403).json({ success: false, message: 'You must belong to an active group to perform this action' });
    }

    // If a specific groupId is provided, verify membership in that group
    const requestedGroupId = req.body?.groupId || req.query?.groupId || null;
    if (requestedGroupId && mongoose.Types.ObjectId.isValid(requestedGroupId)) {
      const isMember = student.groupIds.some((gid) => gid.toString() === requestedGroupId.toString());
      if (!isMember) {
        return res.status(403).json({ success: false, message: 'You are not a member of this group' });
      }
      const group = await Group.findOne({ _id: requestedGroupId, isActive: true }).lean();
      if (!group) {
        return res.status(404).json({ success: false, message: 'Group not found or inactive' });
      }
      req.currentStudent = student;
      req.group = group;
      return next();
    }

    // No specific group — just verify at least one active group exists
    const hasActiveGroup = await Group.findOne({ _id: { $in: student.groupIds }, isActive: true }).lean();
    if (!hasActiveGroup) {
      return res.status(403).json({ success: false, message: 'You must belong to an active group to perform this action' });
    }

    req.currentStudent = student;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCurrentStudent,
  requireAuthStudent,
  requireAdmin,
  requireGroupAccess,
  requireGroupCreator,
  requireActiveGroupMembership,
};
