import { Response } from 'express';
import { Claim } from '../models/Claim.js';
import { TPAQuery } from '../models/TPAQuery.js';
import { AuditLog } from '../models/AuditLog.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export class DashboardController {
  /**
   * Hospital Portal Dashboard Metrics
   */
  public static async getHospitalMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const [
        totalClaims,
        draftClaims,
        submittedClaims,
        underReviewClaims,
        queryRaisedClaims,
        approvedClaims,
        rejectedClaims,
        sanctionedClaims,
        settledClaims,
        financialAggregation,
        pendingQueries,
        recentActivity,
      ] = await Promise.all([
        Claim.countDocuments(),
        Claim.countDocuments({ status: 'DRAFT' }),
        Claim.countDocuments({ status: 'SUBMITTED' }),
        Claim.countDocuments({ status: 'TPA_REVIEW' }),
        Claim.countDocuments({ status: 'QUERY_RAISED' }),
        Claim.countDocuments({ status: 'APPROVED' }),
        Claim.countDocuments({ status: 'REJECTED' }),
        Claim.countDocuments({ status: 'SANCTIONED' }),
        Claim.countDocuments({ status: 'SETTLED' }),
        Claim.aggregate([
          {
            $group: {
              _id: null,
              totalClaimed: { $sum: '$financialDetails.totalClaimedAmount' },
              totalApproved: { $sum: { $ifNull: ['$financialDetails.approvedAmount', 0] } },
              totalSanctioned: { $sum: { $ifNull: ['$financialDetails.sanctionedAmount', 0] } },
            },
          },
        ]),
        TPAQuery.find({ status: { $in: ['OPEN', 'REOPENED'] } })
          .populate('claimId', 'claimId patientDetails.name tpaProvider')
          .sort({ deadline: 1 })
          .limit(5)
          .lean(),
        AuditLog.find()
          .populate('performedBy', 'name email role')
          .populate('claimId', 'claimId patientDetails.name')
          .sort({ timestamp: -1 })
          .limit(10)
          .lean(),
      ]);

      const financials = financialAggregation[0] || {
        totalClaimed: 0,
        totalApproved: 0,
        totalSanctioned: 0,
      };

      res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalClaims,
            draftClaims,
            submittedClaims,
            underReviewClaims,
            queryRaisedClaims,
            approvedClaims,
            rejectedClaims,
            sanctionedClaims,
            settledClaims,
          },
          financials,
          pendingQueries,
          recentActivity,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve hospital dashboard metrics',
        error: (error as Error).message,
      });
    }
  }

  /**
   * TPA Portal Dashboard Metrics
   */
  public static async getTPAMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const now = new Date();

      const [
        incomingClaims,
        pendingReview,
        queryRaised,
        approved,
        rejected,
        sanctioned,
        settled,
        overdueQueriesCount,
        financialAggregation,
        urgentQueries,
      ] = await Promise.all([
        Claim.countDocuments({ status: 'SUBMITTED' }),
        Claim.countDocuments({ status: 'TPA_REVIEW' }),
        Claim.countDocuments({ status: 'QUERY_RAISED' }),
        Claim.countDocuments({ status: 'APPROVED' }),
        Claim.countDocuments({ status: 'REJECTED' }),
        Claim.countDocuments({ status: 'SANCTIONED' }),
        Claim.countDocuments({ status: 'SETTLED' }),
        TPAQuery.countDocuments({
          status: { $in: ['OPEN', 'REOPENED'] },
          deadline: { $lt: now },
        }),
        Claim.aggregate([
          {
            $group: {
              _id: null,
              totalRequestedAmount: { $sum: '$financialDetails.totalClaimedAmount' },
              totalAuthorizedAmount: { $sum: { $ifNull: ['$financialDetails.approvedAmount', 0] } },
              totalSanctionedAmount: { $sum: { $ifNull: ['$financialDetails.sanctionedAmount', 0] } },
            },
          },
        ]),
        TPAQuery.find({ status: { $in: ['OPEN', 'REOPENED'] } })
          .populate('claimId', 'claimId patientDetails.name tpaProvider financialDetails.totalClaimedAmount')
          .populate('raisedBy', 'name email')
          .sort({ deadline: 1 })
          .limit(8)
          .lean(),
      ]);

      const financials = financialAggregation[0] || {
        totalRequestedAmount: 0,
        totalAuthorizedAmount: 0,
        totalSanctionedAmount: 0,
      };

      res.status(200).json({
        success: true,
        data: {
          metrics: {
            incomingClaims,
            pendingReview,
            queryRaised,
            approved,
            rejected,
            sanctioned,
            settled,
            overdueClaims: overdueQueriesCount,
          },
          financials,
          urgentQueries,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve TPA dashboard metrics',
        error: (error as Error).message,
      });
    }
  }
}

