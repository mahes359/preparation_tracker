const router = require('express').Router();
const { z } = require('zod');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/groups.controller');
const { requireAuthStudent, requireAdmin, requireGroupCreator, requireGroupAccess } = require('../middleware/rbac');

const createRequestSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(1500).optional().default(''),
});

const joinGroupSchema = z.object({
  joinCode: z.string().min(4).max(12),
});

// Block admin from joining or creating group requests
const blockAdmin = (req, res, next) => {
  if (req.currentStudent && req.currentStudent.role === 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admins cannot join or create groups' });
  }
  return next();
};

router.post('/requests', requireAuthStudent, blockAdmin, validate(createRequestSchema), ctrl.requestGroup);
router.get('/requests', requireAdmin, ctrl.getGroupRequests);
router.put('/requests/:id/approve', requireAdmin, (req, res, next) => { req.body = { ...req.body, action: 'APPROVED' }; next(); }, ctrl.handleRequestDecision);
router.put('/requests/:id/reject', requireAdmin, (req, res, next) => { req.body = { ...req.body, action: 'REJECTED' }; next(); }, ctrl.handleRequestDecision);
router.get('/user/memberships', requireAuthStudent, ctrl.getUserMemberships);
router.get('/user/notifications/count', requireAuthStudent, ctrl.getNotificationCount);
router.post('/join', requireAuthStudent, blockAdmin, validate(joinGroupSchema), ctrl.requestJoinGroup);
router.get('/', requireAuthStudent, ctrl.getGroups);
router.post('/', requireAdmin, validate(createRequestSchema), ctrl.createGroup);
router.get('/:id/members', requireGroupAccess, ctrl.getGroupMembers);
router.get('/:id/requests', requireGroupCreator, ctrl.getJoinRequests);
router.put('/:id/requests/:requestId/approve', requireGroupCreator, (req, res, next) => { req.body = { ...req.body, action: 'APPROVE' }; next(); }, ctrl.reviewJoinRequest);
router.put('/:id/requests/:requestId/reject', requireGroupCreator, (req, res, next) => { req.body = { ...req.body, action: 'REJECT' }; next(); }, ctrl.reviewJoinRequest);
router.delete('/:id/members/:userId', requireGroupCreator, ctrl.removeGroupMember);
router.post('/:id/leave', requireAuthStudent, ctrl.leaveGroup);
router.get('/:id/dashboard', requireGroupAccess, ctrl.groupDashboard);
router.get('/:id', requireGroupAccess, ctrl.getGroup);
router.put('/:id', requireGroupCreator, validate(createRequestSchema), ctrl.updateGroup);
router.delete('/:id', requireGroupCreator, ctrl.deleteGroup);

module.exports = router;
