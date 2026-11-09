import React from 'react';
import { AuditLogItem } from '../../types';
import { Clock, ShieldCheck, User as UserIcon, ArrowRight } from 'lucide-react';

interface AuditTimelineProps {
  logs: AuditLogItem[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
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
    <div className="relative pl-6 space-y-5 before:absolute before:bottom-2 before:top-2 before:left-2 before:w-0.5 before:bg-slate-200">
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
              className={`absolute -left-6 top-1.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white shadow-2xs ${
                isHospital ? 'bg-brand-600' : 'bg-teal-600'
              }`}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-clinical hover:border-slate-300 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-900">
                  {getActionLabel(log.action)}
                </span>
                <span className="flex items-center text-[11px] text-slate-400 font-medium">
                  <Clock className="h-3 w-3 mr-1 text-slate-400" />
                  {formattedDate}
                </span>
              </div>

              <div className="mt-1.5 flex items-center space-x-2 text-xs text-slate-600">
                <div className="flex items-center space-x-1 font-medium">
                  <UserIcon className="h-3 w-3 text-slate-400" />
                  <span className="font-semibold text-slate-800">{log.performedBy?.name || 'System Operator'}</span>
                </div>
                <span>•</span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase border ${
                    isHospital
                      ? 'bg-brand-50 text-brand-700 border-brand-200'
                      : 'bg-teal-50 text-teal-800 border-teal-200'
                  }`}
                >
                  {isHospital ? 'Hospital Billing Desk' : 'TPA Underwriter Desk'}
                </span>
              </div>

              {log.details?.message && (
                <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {log.details.message}
                </p>
              )}

              {log.action === 'AI_FIELD_CORRECTED' && log.details?.correctionReason && (
                <div className="mt-2 text-xs text-slate-700 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200">
                  <div className="font-bold text-amber-900 mb-0.5">Audit Justification:</div>
                  <p>{log.details.correctionReason}</p>
                  {log.previousValue !== undefined && log.newValue !== undefined && (
                    <div className="mt-1.5 pt-1.5 border-t border-amber-200/60 flex items-center space-x-2 font-mono text-[11px]">
                      <span className="text-rose-600 line-through">
                        {String(log.previousValue) || 'None'}
                      </span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <span className="text-emerald-700 font-bold">
                        {String(log.newValue)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

