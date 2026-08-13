// src/routes/students.routes.js

const router = require('express').Router();
const { z } = require('zod');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/students.controller');

const createStudentSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  avatarColor: z.string().optional(),
});

router.get('/', ctrl.getStudents);
router.post('/', validate(createStudentSchema), ctrl.createStudent);
router.get('/:id', ctrl.getStudent);
router.put('/:id', ctrl.updateStudent);
router.delete('/:id', ctrl.deleteStudent);
router.get('/:id/stats', ctrl.getStudentStatsHandler);

module.exports = router;
