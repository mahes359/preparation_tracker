// src/routes/problems.routes.js

const router = require('express').Router();
const { z } = require('zod');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/problems.controller');

const createProblemSchema = z.object({
  studentId: z.string().length(24, 'Invalid student ID'),
  leetcodeUrl: z
    .string()
    .url()
    .refine((u) => u.includes('leetcode.com/problems/'), {
      message: 'Must be a valid LeetCode problem URL',
    }),
  date: z.string().optional(), // YYYY-MM-DD, defaults to today on server
});

router.get('/', ctrl.getProblems);
router.post('/', validate(createProblemSchema), ctrl.createProblem);
router.get('/:id', ctrl.getProblem);
router.patch('/:id/complete', ctrl.completeProblem);
router.delete('/:id', ctrl.deleteProblem);

module.exports = router;
