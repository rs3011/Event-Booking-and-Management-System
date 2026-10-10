const { body } = require('express-validator');

const updateUserRoleRules = [
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['attendee', 'organizer', 'admin'])
    .withMessage('Role must be attendee, organizer, or admin'),
];

const updateEventStatusRules = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['draft', 'pending_approval', 'published', 'cancelled', 'completed'])
    .withMessage('Status must be draft, pending_approval, published, cancelled, or completed'),
];

const rejectEventRules = [
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ max: 1000 })
    .withMessage('Rejection reason cannot exceed 1000 characters'),
];

module.exports = { updateUserRoleRules, updateEventStatusRules, rejectEventRules };
