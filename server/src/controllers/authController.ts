import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { JWTPayload } from '../types/index.js';

export class AuthController {
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact your system administrator.',
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      const payload: JWTPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        organization: user.organization,
        name: user.name,
      };

      const token = jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
      } as jwt.SignOptions);

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: {
          token,
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            organization: user.organization,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error during login',
        error: (error as Error).message,
      });
    }
  }

  public static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await User.findById(req.user.userId).select('-passwordHash');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          organization: user.organization,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching current user profile',
        error: (error as Error).message,
      });
    }
  }

  public static async getDemoAccounts(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: [
        {
          role: 'HOSPITAL_STAFF',
          label: 'Hospital Billing Staff',
          email: 'hospital@claimflow.demo',
          organization: 'City Care Multispecialty Hospital',
          description: 'Create draft claims, upload clinical documents, correct AI fields, and respond to queries.',
        },
        {
          role: 'TPA_MANAGER',
          label: 'TPA Underwriting Manager',
          email: 'tpa@claimflow.demo',
          organization: 'HealthGuard TPA Services',
          description: 'Review claims, inspect clinical evidence, raise formal queries, authorize amounts, and approve or reject claims.',
        },
      ],
    });
  }
}

