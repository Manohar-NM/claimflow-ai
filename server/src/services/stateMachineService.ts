import { ClaimStatus, UserRole } from '../types/index.js';

export interface TransitionRule {
  allowedFrom: ClaimStatus[];
  allowedRoles: UserRole[];
}

export const STATE_TRANSITIONS: Record<ClaimStatus, TransitionRule> = {
  DRAFT: {
    allowedFrom: [],
    allowedRoles: ['HOSPITAL_STAFF'],
  },
  SUBMITTED: {
    allowedFrom: ['DRAFT'],
    allowedRoles: ['HOSPITAL_STAFF'],
  },
  TPA_REVIEW: {
    allowedFrom: ['SUBMITTED', 'QUERY_RAISED'],
    allowedRoles: ['TPA_MANAGER', 'HOSPITAL_STAFF'], // Hospital staff transitions when responding to a query
  },
  QUERY_RAISED: {
    allowedFrom: ['TPA_REVIEW'],
    allowedRoles: ['TPA_MANAGER'],
  },
  APPROVED: {
    allowedFrom: ['TPA_REVIEW'],
    allowedRoles: ['TPA_MANAGER'],
  },
  SANCTIONED: {
    allowedFrom: ['APPROVED'],
    allowedRoles: ['TPA_MANAGER'],
  },
  SETTLED: {
    allowedFrom: ['SANCTIONED'],
    allowedRoles: ['TPA_MANAGER'],
  },
  REJECTED: {
    allowedFrom: ['TPA_REVIEW'],
    allowedRoles: ['TPA_MANAGER'],
  },
};

export class StateMachineService {
  public static canTransition(
    currentStatus: ClaimStatus,
    targetStatus: ClaimStatus,
    role: UserRole
  ): { allowed: boolean; reason?: string } {
    if (currentStatus === targetStatus) {
      return { allowed: false, reason: `Claim is already in status '${currentStatus}'` };
    }

    const rule = STATE_TRANSITIONS[targetStatus];
    if (!rule) {
      return { allowed: false, reason: `Invalid target status '${targetStatus}'` };
    }

    if (!rule.allowedFrom.includes(currentStatus)) {
      return {
        allowed: false,
        reason: `Cannot transition claim status from '${currentStatus}' to '${targetStatus}'. Allowed previous statuses: [${rule.allowedFrom.join(', ')}]`,
      };
    }

    if (!rule.allowedRoles.includes(role)) {
      return {
        allowed: false,
        reason: `User with role '${role}' is not authorized to transition claim to '${targetStatus}'. Required role(s): [${rule.allowedRoles.join(', ')}]`,
      };
    }

    return { allowed: true };
  }
}
