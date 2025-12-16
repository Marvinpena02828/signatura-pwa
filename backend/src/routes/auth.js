import express from 'express';
import { body, validationResult } from 'express-validator';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../../server.js';

const router = express.Router();

// Sign up
router.post('/signup', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['issuer', 'owner', 'admin']).withMessage('Invalid role'),
  body('organizationName').optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role, organizationName } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create user profile
    const { data: userData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        role,
        organization_name: organizationName,
      })
      .select()
      .single();

    if (profileError) {
      // Cleanup: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ error: 'Failed to create user profile' });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: authData.user.id,
        email: authData.user.email,
        role: userData.role,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: userData,
      token,
    });
  } catch (error) {
    next(error);
  }
});

// Sign in
router.post('/signin', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Get user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Sign in with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: userData.id,
        email: userData.email,
        role: userData.role,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Log auth event
    await supabase.from('audit_logs').insert({
      actor_id: userData.id,
      action: 'signin',
      resource_type: 'user',
      resource_id: userData.id,
      details: { email, timestamp: new Date() },
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    res.json({
      message: 'Signed in successfully',
      user: userData,
      token,
      session: authData.session,
    });
  } catch (error) {
    next(error);
  }
});

// Verify token
router.post('/verify-token', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    res.json({
      valid: true,
      user: decoded,
    });
  } catch (error) {
    res.status(401).json({
      valid: false,
      error: 'Invalid token',
    });
  }
});

// Refresh token
router.post('/refresh-token', async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new JWT
    const token = jwt.sign(
      {
        userId: data.user.id,
        email: data.user.email,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      session: data.session,
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', async (req, res, next) => {
  try {
    const userId = req.body.userId;

    // Log logout event
    if (userId) {
      await supabase.from('audit_logs').insert({
        actor_id: userId,
        action: 'logout',
        resource_type: 'user',
        resource_id: userId,
        details: { timestamp: new Date() },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
