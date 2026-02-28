import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import type { User } from '../db/schema';
import { storage } from '../server/storage';
import type { Request, Response, NextFunction } from 'express';

// Load env vars
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Serialize user to session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Configure Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password',
    },
    async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        
        // Use bcrypt to compare passwords
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Configure Google OAuth2 Strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Google ID
          let user = await storage.getUserByGoogleId(profile.id);
          
          if (user) {
            // User exists, return them
            return done(null, user);
          }
          
          // Check if user exists by email (from Google profile)
          const email = profile.emails?.[0]?.value;
          if (email) {
            const existingUserByEmail = await storage.getUserByUsername(email);
            if (existingUserByEmail) {
              // Link Google ID to existing user
              user = await storage.createUserWithGoogle(profile.id, existingUserByEmail.username, email);
              return done(null, user);
            }
          }
          
          // Create new user with Google
          const username = profile.displayName || profile.emails?.[0]?.value || `user_${profile.id}`;
          user = await storage.createUserWithGoogle(profile.id, username, email || username);
          
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
}

// Auth middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// Optional auth - continues whether authenticated or not
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  // Continue without user
  return next();
}

export { passport };
