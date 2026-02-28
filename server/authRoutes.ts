import type { Express } from 'express';
import type { Server } from 'http';
import passport from 'passport';
import { storage } from '../server/storage';
import type { User } from '../db/schema';
import './auth'; // Load global type augmentations

// Check if Google OAuth is configured
function isGoogleConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export async function registerAuthRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const express = await import('express');
  const router = express.default.Router();

  // POST /api/auth/register
  router.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
      }

      if (password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      // Create new user
      const user = await storage.createUser(username, password);
      
      // Log in the user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to login after registration' });
        }
        return res.status(201).json({ 
          id: user.id, 
          username: user.username 
        });
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  });

  // POST /api/auth/login
  router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: 'Authentication error' });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || 'Invalid credentials' });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ error: 'Login failed' });
        }
        return res.json({ 
          id: user.id, 
          username: user.username 
        });
      });
    })(req, res, next);
  });

  // POST /api/auth/logout
  router.post('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  // GET /api/auth/me
  router.get('/me', (req, res) => {
    if (req.isAuthenticated()) {
      return res.json({ 
        id: req.user?.id, 
        username: req.user?.username 
      });
    }
    res.status(401).json({ error: 'Not authenticated' });
  });

  // GET /api/auth/google - Initiates OAuth flow (redirects to Google)
  router.get('/google', (req, res, next) => {
    if (!isGoogleConfigured()) {
      return res.status(501).json({ error: 'Google OAuth is not configured' });
    }
    passport.authenticate('google', {
      scope: ['profile', 'email'],
    })(req, res, next);
  });

  // GET /api/auth/google/callback - Handles OAuth callback
  router.get('/google/callback', (req, res, next) => {
    if (!isGoogleConfigured()) {
      return res.status(501).json({ error: 'Google OAuth is not configured' });
    }
    passport.authenticate('google', {
      successRedirect: '/api/auth/google/success',
      failureRedirect: '/api/auth/google/failure',
    })(req, res, next);
  });

  // GET /api/auth/google/success - OAuth success page (for redirect)
  router.get('/google/success', (req, res) => {
    if (req.isAuthenticated()) {
      res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
    } else {
      res.redirect(process.env.FRONTEND_URL + '/login' || 'http://localhost:5173/login');
    }
  });

  // GET /api/auth/google/failure - OAuth failure page (for redirect)
  router.get('/google/failure', (req, res) => {
    res.redirect(process.env.FRONTEND_URL + '/login?error=google_auth_failed' || 'http://localhost:5173/login?error=google_auth_failed');
  });

  // Mount auth routes
  app.use('/api/auth', router);

  return httpServer;
}
