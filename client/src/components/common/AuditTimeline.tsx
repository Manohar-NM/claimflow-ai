import React from 'react';
import { AuditLogItem } from '../../types';
import { Clock, ShieldCheck, User as UserIcon } from 'lucide-react';

interface AuditTimelineProps {
  logs: AuditLogItem[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-slate-400">
        No audit log events recorded yet.
      </div>
    );
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CLAIM_CREATED':
        return 'Claim Initialized';
      case 'CLAIM_UPDATED':
        return 'Draft Details Updated';
      case 'DOCUMENT_UPLOADED':
        return 'Document Uploaded';
      case 'AI_ANALYSIS_COMPLETED':
        return 'AI Extraction Processed';
      case 'AI_FIELD_CORRECTED':
        return 'AI Field Manually Verified';
      case 'CLAIM_SUBMITTED':
        return 'Submitted to TPA';
      case 'TPA_REVIEW_STARTED':
        return 'TPA Underwriter Review Started';
      case 'QUERY_RAISED':
        return 'Formal Query Raised';
      case 'HOSPITAL_RESPONDED':
        return 'Hospital Query Response Submitted';
      case 'QUERY_RESOLVED':
        return 'Query Resolved';
      case 'QUERY_REOPENED':
        return 'Query Reopened';
      case 'CLAIM_APPROVED':
        return 'Pre-Authorization Approved';
      case 'CLAIM_SANCTIONED':
        return 'Cashless Sanction Issued';
      case 'CLAIM_SETTLED':
        return 'Claim Settled & Closed';
      case 'CLAIM_REJECTED':
        return 'Claim Rejected';
      default:
        return action.replace(/_/g, ' ');
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:bottom-0 before:top-2 before:left-2 before:w-0.5 before:bg-slate-200">
      {logs.map((log) => {
        const isHospital = log.performedByRole === 'HOSPITAL_STAFF';
        const formattedDate = new Date(log.timestamp).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        return (
          <div key={log._id} className="relative group">
            {/* Dot indicator */}
            <div
              className={`absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                isHospital ? 'bg-brand-600' : 'bg-indigo-600'
              }`}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  {getActionLabel(log.action)}
                </span>
                <span className="flex items-center text-[11px] text-slate-400">
                  <Clock className="h-3 w-3 mr-1" />
                  {formattedDate}
                </span>
              </div>

              <div className="mt-1 flex items-center space-x-2 text-xs text-slate-600">
                <div className="flex items-center space-x-1 font-medium">
                  <UserIcon className="h-3 w-3 text-slate-400" />
                  <span>{log.performedBy?.name || 'System User'}</span>
                </div>
                <span>•</span>
                <span
                  className={`rounded px-1.5 py-0.2 text-[10px] font-semibold uppercase ${
                    isHospital ? 'bg-brand-50 text-brand-700' : 'bg-indigo-50 text-indigo-700'
                  }`}
                >
                  {log.performedByRole === 'HOSPITAL_STAFF' ? 'Hospital Billing' : 'TPA Underwriter'}
                </span>
              </div>

              {log.details?.message && (
                <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {log.details.message}
                </p>
              )}

              {log.action === 'AI_FIELD_CORRECTED' && log.details?.correctionReason && (
                <div className="mt-2 text-[11px] text-slate-500 bg-amber-50/70 p-2 rounded-lg border border-amber-200">
                  <span className="font-semibold text-amber-800">Audit Justification: </span>
                  {log.details.correctionReason}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
