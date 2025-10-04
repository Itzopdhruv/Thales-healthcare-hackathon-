import { body, validationResult } from 'express-validator';

/**
 * Validation middleware for patient creation
 */
export const validatePatientCreation = [
  // Required fields validation
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('age')
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be a valid number between 0 and 150'),

  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),

  body('dateOfBirth')
    .notEmpty().withMessage('Date of birth is required')
    .custom((value) => {
      if (!value) return true;
      const birthDate = new Date(value);
      if (isNaN(birthDate.getTime())) {
        throw new Error('Invalid date format');
      }
      return true;
    }),

  body('phoneNumber')
    .isLength({ min: 10, max: 10 })
    .withMessage('Phone number must be exactly 10 digits'),

  // Optional fields validation
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),

  body('bloodType')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Blood type cannot exceed 10 characters'),

  body('emergencyContact')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Emergency contact information cannot exceed 200 characters'),

  body('allergies')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Allergies information cannot exceed 1000 characters'),

  body('medicalConditions')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Medical conditions information cannot exceed 1000 characters'),

  body('medications')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Medications information cannot exceed 1000 characters'),

  // Address validation
  body('address.street')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Street address cannot exceed 200 characters'),

  body('address.city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('City name cannot exceed 100 characters'),

  body('address.state')
    .optional()
    .isLength({ max: 100 })
    .withMessage('State name cannot exceed 100 characters'),

  body('address.pincode')
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage('Pincode must be exactly 6 digits')
    .matches(/^\d{6}$/)
    .withMessage('Pincode must contain only numbers'),

  body('address.country')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Country name cannot exceed 50 characters'),

  // Error handling middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      });
    }
    next();
  }
];

/**
 * Validation middleware for ABHA ID lookup
 */
export const validateABHALookup = [
  body('abhaNumber')
    .notEmpty()
    .withMessage('ABHA number is required')
    .matches(/^\d{2}-\d{2}-\d{2}-\d{2}$/)
    .withMessage('ABHA number must be in format XX-XX-XX-XX'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      });
    }
    next();
  }
];

/**
 * Validation middleware for patient update
 */
export const validatePatientUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Phone number must be a valid Indian mobile number'),

  body('profile.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),

  body('profile.gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      });
    }
    next();
  }
];
