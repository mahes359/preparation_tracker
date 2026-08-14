const mongoose = require('mongoose');
const asyncHandler = require('../middleware/asyncHandler');
const Group = require('../models/Group');
const GroupCreationRequest = require('../models/GroupCreationRequest');
const GroupJoinRequest = require('../models/GroupJoinRequest');
const Student = require('../models/Student');
const Problem = require('../models/Problem');
const Completion = require('../models/Completion');
const { getGroupStats } = require('../services/leaderboard.service');
const { getCurrentStudent, requireAdmin, requireGroupCreator } = require('../middleware/rbac');

const randomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const ensureStudentMembership = async (studentId, groupId) => {
  const student = await Student.findById(studentId);
  if (!student) return;
  if (!student.groupIds.some((group) => group.toString() === groupId.toString())) {
    student.groupIds.push(groupId);
    if (!student.groupId) student.groupId = groupId;
    await student.save();
  }
};

const requestGroup = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const student = await getCurrentStudent(req);
  if (!student) return res.status(401).json({ success: false, message: 'Authentication required' });

  const existing = await GroupCreationRequest.findOne({ userId: student._id, status: 'PENDING' }).lean();
  if (existing) {
    return res.status(400).json({ success: false, message: 'You already have a pending group request' });
  }

  const request = await GroupCreationRequest.create({ userId: student._id, name, description, status: 'PENDING' });
  res.status(201).json({ success: true, data: request });
});

const getGroupRequests = asyncHandler(async (req, res) => {
  const requests = await GroupCreationRequest.find().populate('userId', 'name email avatarColor').sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: requests });
});

const handleRequestDecision = asyncHandler(async (req, res) => {
  const request = await GroupCreationRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

  const action = (req.body?.status || req.body?.action || req.params.action || 'APPROVED').toUpperCase();

  if (action === 'APPROVED') {
    const joinCode = randomCode();
    const group = await Group.create({
      name: request.name,
      description: request.description,
      joinCode,
      createdBy: request.userId,
      status: 'APPROVED',
      members: [request.userId],
      isActive: true,
    });

    const student = await Student.findById(request.userId);
    if (student) {
      if (student.role !== 'ADMIN') student.role = 'GROUP_CREATOR';
      if (!student.groupIds.some((groupId) => groupId.toString() === group._id.toString())) {
        student.groupIds.push(group._id);
      }
      student.groupId = group._id;
      await student.save();
    }

    request.status = 'APPROVED';
    await request.save();
    return res.json({ success: true, data: { group, request } });
  }

  request.status = 'REJECTED';
  await request.save();
  res.json({ success: true, data: request });
});

const getGroups = asyncHandler(async (req, res) => {
  const student = await getCurrentStudent(req);
  const query = { isActive: true };

  if (student && student.role !== 'ADMIN') {
    query._id = { $in: student.groupIds || [] };
  }

  const groups = await Group.find(query)
    .populate('createdBy', 'name email avatarColor role')
    .populate('members', 'name email avatarColor role')
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: groups });
});

const getGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id).populate('createdBy', 'name email avatarColor role').populate('members', 'name email avatarColor role').lean();
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  res.json({ success: true, data: group });
});

const createGroup = asyncHandler(async (req, res) => {
  const student = await getCurrentStudent(req);
  if (!student) return res.status(401).json({ success: false, message: 'Authentication required' });
  if (student.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Only admin can create groups directly' });
  }
  const { name, description } = req.body;
  const joinCode = randomCode();
  const group = await Group.create({ name, description, joinCode, createdBy: student._id, status: 'APPROVED', members: [student._id], isActive: true });

  if (student.role !== 'ADMIN') student.role = 'GROUP_CREATOR';
  student.groupIds = student.groupIds || [];
  if (!student.groupIds.some((groupId) => groupId.toString() === group._id.toString())) student.groupIds.push(group._id);
  student.groupId = group._id;
  await student.save();

  res.status(201).json({ success: true, data: group });
});

const updateGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

  if (!req.currentStudent || (req.currentStudent.role !== 'ADMIN' && group.createdBy.toString() !== req.currentStudent._id.toString())) {
    return res.status(403).json({ success: false, message: 'You cannot edit this group' });
  }

  Object.assign(group, req.body);
  await group.save();
  res.json({ success: true, data: group });
});

const deleteGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

  if (req.currentStudent.role !== 'ADMIN' && group.createdBy.toString() !== req.currentStudent._id.toString()) {
    return res.status(403).json({ success: false, message: 'You cannot delete this group' });
  }

  group.isActive = false;
  await group.save();
  res.json({ success: true, message: 'Group deactivated' });
});

const requestJoinGroup = asyncHandler(async (req, res) => {
  const student = await getCurrentStudent(req);
  if (!student) return res.status(401).json({ success: false, message: 'Authentication required' });
  const group = await Group.findOne({ joinCode: req.body.joinCode?.toUpperCase(), isActive: true, status: 'APPROVED' }).lean();
  if (!group) return res.status(404).json({ success: false, message: 'Invalid or inactive join code' });

  const alreadyMember = group.members.some((memberId) => memberId.toString() === student._id.toString());
  if (alreadyMember) return res.status(400).json({ success: false, message: 'You are already a member' });

  const existingRequest = await GroupJoinRequest.findOne({ groupId: group._id, userId: student._id, status: 'PENDING' });
  if (existingRequest) return res.status(400).json({ success: false, message: 'Join request already pending' });

  const request = await GroupJoinRequest.create({ groupId: group._id, userId: student._id, status: 'PENDING' });
  res.status(201).json({ success: true, data: request });
});

const getJoinRequests = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  if (req.currentStudent.role !== 'ADMIN' && group.createdBy.toString() !== req.currentStudent._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const requests = await GroupJoinRequest.find({ groupId: group._id }).populate('userId', 'name email avatarColor').sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: requests });
});

const reviewJoinRequest = asyncHandler(async (req, res) => {
  const request = await GroupJoinRequest.findById(req.params.requestId);
  if (!request) return res.status(404).json({ success: false, message: 'Join request not found' });

  const group = await Group.findById(request.groupId);
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  if (req.currentStudent.role !== 'ADMIN' && group.createdBy.toString() !== req.currentStudent._id.toString()) {
    return res.status(403).json({ success: false, message: 'You can only review your own group requests' });
  }

  const action = (req.body?.action || req.body?.status || req.params.action || 'APPROVE').toUpperCase();

  if (action === 'APPROVE' || action === 'APPROVED') {
    request.status = 'APPROVED';
    if (!group.members.some((id) => id.toString() === request.userId.toString())) {
      group.members.push(request.userId);
    }
    await group.save();
    await ensureStudentMembership(request.userId, group._id);
    await Student.findByIdAndUpdate(request.userId, { $addToSet: { groupIds: group._id }, $set: { groupId: group._id } });
  } else {
    request.status = 'REJECTED';
  }

  await request.save();
  res.json({ success: true, data: request });
});

const leaveGroup = asyncHandler(async (req, res) => {
  const student = await getCurrentStudent(req);
  if (!student) return res.status(401).json({ success: false, message: 'Authentication required' });

  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

  if (group.createdBy.toString() === student._id.toString()) {
    return res.status(400).json({ success: false, message: 'Group creator cannot leave. Transfer ownership or delete the group.' });
  }

  group.members = group.members.filter((id) => id.toString() !== student._id.toString());
  await group.save();

  student.groupIds = (student.groupIds || []).filter((id) => id.toString() !== group._id.toString());
  if (student.groupId && student.groupId.toString() === group._id.toString()) {
    student.groupId = student.groupIds[0] || null;
  }
  await student.save();

  res.json({ success: true, message: 'You have left the group' });
});

const getGroupMembers = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id).populate('members', 'name email avatarColor role').lean();
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  res.json({ success: true, data: group.members });
});

const removeGroupMember = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  if (req.currentStudent.role !== 'ADMIN' && group.createdBy.toString() !== req.currentStudent._id.toString()) {
    return res.status(403).json({ success: false, message: 'You cannot manage this group' });
  }
  const memberId = req.params.userId;
  group.members = group.members.filter((id) => id.toString() !== memberId);
  await group.save();

  const student = await Student.findById(memberId);
  if (student) {
    student.groupIds = (student.groupIds || []).filter((id) => id.toString() !== group._id.toString());
    if (student.groupId && student.groupId.toString() === group._id.toString()) student.groupId = student.groupIds[0] || null;
    await student.save();
  }

  res.json({ success: true, message: 'Member removed' });
});

const groupDashboard = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id).lean();
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  const [groupStats, members, questions] = await Promise.all([
    getGroupStats(group._id.toString()),
    Student.find({ isActive: true, groupIds: group._id }).lean({ virtuals: true }),
    Problem.find({ groupId: group._id }).populate('studentId', 'name email avatarColor').sort({ createdAt: -1 }).lean({ virtuals: true }),
  ]);
  res.json({ success: true, data: { group, groupStats, members, questions } });
});

const getUserMemberships = asyncHandler(async (req, res) => {
  const student = await getCurrentStudent(req);
  if (!student) return res.status(401).json({ success: false, message: 'Authentication required' });

  // Get all groups the student belongs to (active groups in groupIds)
  const membershipGroups = await Group.find({
    _id: { $in: student.groupIds || [] },
    isActive: true,
  })
    .populate('createdBy', 'name email avatarColor')
    .populate('members', 'name email avatarColor role')
    .lean();

  // Get pending creation requests
  const pendingCreationReq = await GroupCreationRequest.findOne({
    userId: student._id,
    status: 'PENDING',
  }).lean();

  // Get pending join requests
  const pendingJoinReqs = await GroupJoinRequest.find({
    userId: student._id,
    status: 'PENDING',
  })
    .populate('groupId', 'name joinCode')
    .lean();

  // Build memberships array with status
  const memberships = [];

  // Add pending creation request as PENDING membership
  if (pendingCreationReq) {
    memberships.push({
      _id: pendingCreationReq._id,
      groupId: null, // Group doesn't exist yet
      userId: student._id,
      role: 'CREATOR',
      status: 'PENDING',
      createdAt: pendingCreationReq.createdAt,
      groupName: pendingCreationReq.name,
    });
  }

  // Add pending join requests as PENDING memberships
  pendingJoinReqs.forEach((joinReq) => {
    memberships.push({
      _id: joinReq._id,
      groupId: joinReq.groupId._id,
      userId: student._id,
      role: 'MEMBER',
      status: 'PENDING',
      createdAt: joinReq.createdAt,
      groupName: joinReq.groupId?.name,
    });
  });

  // Add active memberships from groups
  membershipGroups.forEach((group) => {
    const isCreator = group.createdBy._id.toString() === student._id.toString();
    memberships.push({
      _id: group._id,
      groupId: group._id,
      userId: student._id,
      role: isCreator ? 'CREATOR' : 'MEMBER',
      status: 'ACTIVE',
      joinedAt: group.createdAt,
      createdAt: group.createdAt,
    });
  });

  res.json({
    success: true,
    data: {
      memberships,
      groups: membershipGroups,
    },
  });
});

const getNotificationCount = asyncHandler(async (req, res) => {
  const student = await getCurrentStudent(req);
  if (!student) return res.json({ success: true, data: { count: 0 } });

  // Find all groups where this student is the creator
  const creatorGroups = await Group.find({ createdBy: student._id, isActive: true, status: 'APPROVED' }).lean();
  if (creatorGroups.length === 0) return res.json({ success: true, data: { count: 0 } });

  const groupIds = creatorGroups.map((g) => g._id);
  const count = await GroupJoinRequest.countDocuments({ groupId: { $in: groupIds }, status: 'PENDING' });
  res.json({ success: true, data: { count } });
});

module.exports = {
  requestGroup,
  getGroupRequests,
  handleRequestDecision,
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  requestJoinGroup,
  getJoinRequests,
  reviewJoinRequest,
  leaveGroup,
  getGroupMembers,
  removeGroupMember,
  groupDashboard,
  getUserMemberships,
  getNotificationCount,
};
