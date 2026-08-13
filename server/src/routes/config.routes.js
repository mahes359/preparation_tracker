// src/routes/config.routes.js

const router = require('express').Router();
const { z } = require('zod');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/config.controller');

const updateConfigSchema = z.object({
  onTimePoints: z.number().int().min(1).max(100),
  latePoints: z.number().int().min(0).max(100),
  deadlineHourUTC: z.number().int().min(0).max(23),
  description: z.string().optional(),
});

router.get('/scoring', ctrl.getScoringConfig);
router.put('/scoring', validate(updateConfigSchema), ctrl.updateScoringConfig);

module.exports = router;
