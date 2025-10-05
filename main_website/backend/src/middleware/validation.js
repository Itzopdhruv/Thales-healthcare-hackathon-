import { body } from 'express-validator';

export const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('hospitalName')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Hospital Name cannot be empty if provided'),
  
  body('hospitalCode')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Hospital Code cannot be empty if provided')
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const validateProfileUpdate = [
  body('profile.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  
  body('profile.gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  
  body('profile.address.pincode')
    .optional()
    .isPostalCode('IN')
    .withMessage('Please provide a valid Indian postal code'),
  
  body('profile.emergencyContact.phone')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian mobile number for emergency contact')
];

export const validateVerifyOTP = [
  body('accessId')
    .notEmpty()
    .withMessage('Access ID is required'),
  
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
];

export const validateCreateMedicalHistory = [
  body('abhaId')
    .notEmpty()
    .withMessage('ABHA ID is required'),
  
  body('entryType')
    .isIn(['consultation', 'prescription', 'lab_test', 'scan', 'surgery', 'vaccination', 'other'])
    .withMessage('Invalid entry type'),
  
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  
  body('summary')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Summary must be between 10 and 1000 characters'),
  
  body('consultingDoctor')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Consulting doctor name must be between 2 and 100 characters'),
  
  body('hospitalClinicName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Hospital/Clinic name must be between 2 and 100 characters')
];

export const validateCreatePrescription = [
  body('abhaId')
    .notEmpty()
    .withMessage('ABHA ID is required'),
  
  body('issuedDate')
    .isISO8601()
    .withMessage('Please provide a valid issued date'),
  
  body('doctor.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Doctor name must be between 2 and 100 characters'),
  
  body('hospitalClinic.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Hospital/Clinic name must be between 2 and 100 characters'),
  
  body('diagnosis.primary')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Primary diagnosis must be between 2 and 200 characters'),
  
  body('medications')
    .isArray({ min: 1 })
    .withMessage('At least one medication is required'),
  
  body('medications.*.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Medication name must be between 2 and 100 characters'),
  
  body('medications.*.dosage')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Medication dosage must be between 1 and 50 characters'),
  
  body('medications.*.frequency')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Medication frequency must be between 1 and 50 characters')
];
