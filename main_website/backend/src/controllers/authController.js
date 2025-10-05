import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, name, email, phone, abhaId, password, role = 'patient', hospitalName, hospitalCode } = req.body;

    // Clean up empty strings
    const cleanPhone = phone && phone.trim() !== '' ? phone : undefined;
    const cleanAbhaId = abhaId && abhaId.trim() !== '' ? abhaId : undefined;

    // Check if user already exists (check username, email, phone, abhaId)
    const existingUserQuery = { email };
    if (cleanPhone) existingUserQuery.phone = cleanPhone;
    if (cleanAbhaId) existingUserQuery.abhaId = cleanAbhaId;

    const existingUser = await User.findOne({
      $or: [
        { username },
        { email },
        ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ...(cleanAbhaId ? [{ abhaId: cleanAbhaId }] : [])
      ]
    });

    if (existingUser) {
      let conflictField = 'email';
      if (existingUser.username === username) conflictField = 'username';
      else if (existingUser.phone === cleanPhone) conflictField = 'phone';
      else if (existingUser.abhaId === cleanAbhaId) conflictField = 'ABHA ID';
      
      return res.status(400).json({
        success: false,
        message: `User already exists with this ${conflictField}`
      });
    }

          // Create new user
          const userData = {
            username,
            name,
            email,
            password,
            role
          };
          
          if (cleanPhone) userData.phone = cleanPhone;
          if (cleanAbhaId) userData.abhaId = cleanAbhaId;
          
          // Add admin-specific fields
          if (role === 'admin') {
            if (hospitalName) userData.hospitalName = hospitalName;
            if (hospitalCode) userData.hospitalCode = hospitalCode;
          }
    
    const user = new User(userData);

    await user.save();

    // Generate token
    const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          abhaId: user.abhaId,
          role: user.role,
          hospitalName: user.hospitalName,
          hospitalCode: user.hospitalCode
        }
      });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        abhaId: user.abhaId,
        role: user.role,
        hospitalName: user.hospitalName,
        hospitalCode: user.hospitalCode
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        abhaId: user.abhaId,
        role: user.role,
        hospitalName: user.hospitalName,
        hospitalCode: user.hospitalCode,
        profile: user.profile,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profile, preferences } = req.body;
    const userId = req.userId;

    const updateData = {};
    if (profile) updateData.profile = profile;
    if (preferences) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        abhaId: user.abhaId,
        role: user.role,
        profile: user.profile,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const logout = async (req, res) => {
  try {
    // In a more sophisticated system, you might want to:
    // 1. Blacklist the JWT token
    // 2. Update user's last logout time
    // 3. Clear any server-side sessions
    
    // For now, we'll just return a success response
    // The client will handle clearing the token from localStorage
    
    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
