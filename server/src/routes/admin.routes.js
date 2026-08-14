const router = require('express').Router();
const { requireAdmin } = require('../middleware/rbac');
const { getGroupRequests } = require('../controllers/groups.controller');
const Student = require('../models/Student');
const Group = require('../models/Group');
const Problem = require('../models/Problem');
const Completion = require('../models/Completion');
const GroupCreationRequest = require('../models/GroupCreationRequest');
const asyncHandler = require('../middleware/asyncHandler');

router.use(requireAdmin);
router.get('/group-requests', getGroupRequests);
router.get('/dashboard', asyncHandler(async (req, res) => {
  const [totalStudents, totalGroups, totalProblems, totalCompletions, pendingGroupRequests, pendingJoinRequests] = await Promise.all([
    Student.countDocuments({ isActive: true, role: { $ne: 'ADMIN' } }),
    Group.countDocuments({ isActive: true }),
    Problem.countDocuments(),
    Completion.countDocuments({ completedAt: { $ne: null } }),
    GroupCreationRequest.countDocuments({ status: 'PENDING' }),
    require('../models/GroupJoinRequest').countDocuments({ status: 'PENDING' }),
  ]);
  const allGroups = await Group.find({ isActive: true })
    .populate('createdBy', 'name email avatarColor')
    .populate('members', 'name email avatarColor role')
    .sort({ createdAt: -1 })
    .lean();
  res.json({
    success: true,
    data: {
      totalStudents,
      totalGroups,
      totalProblems,
      totalCompletions,
      pendingGroupRequests,
      pendingJoinRequests,
      groups: allGroups,
    },
  });
}));

module.exports = router;
