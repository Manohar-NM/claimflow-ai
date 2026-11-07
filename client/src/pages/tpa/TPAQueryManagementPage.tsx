import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { claimsApi } from '../../api/claims';
import { queriesApi } from '../../api/queries';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Modal } from '../../components/common/Modal';
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Search,
} from 'lucide-react';

export const TPAQueryManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [reopenQueryId, setReopenQueryId] = useState<string | null>(null);
  const [newDeadline, setNewDeadline] = useState(
    new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16)
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch claims with queries
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tpa-queries-page'],
    queryFn: () => claimsApi.getClaims({ status: 'QUERY_RAISED' }),
  });

  const claims = data?.data || [];

  const handleResolve = async (queryId: string) => {
    try {
      await queriesApi.resolveQuery(queryId);
      refetch();
      setToastMessage('Query marked as resolved.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenQueryId) return;
    try {
      await queriesApi.reopenQuery(reopenQueryId, new Date(newDeadline).toISOString());
      refetch();
      setReopenQueryId(null);
      setToastMessage('Query reopened with extended SLA deadline.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">TPA Query Management Desk</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track outstanding medical documentation clarifications, evaluate hospital replies, and manage SLA deadlines.
        </p>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400">×</button>
        </div>
      )}

      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : error ? (
        <ErrorState message="Could not load queries desk." onRetry={refetch} />
      ) : claims.length === 0 ? (
        <EmptyState
          title="No Open TPA Queries"
          description="All hospital cashless clarification queries have been resolved or are in review."
          icon={HelpCircle}
        />
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div key={claim._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-slate-900 text-sm">{claim.claimId}</span>
                  <span className="text-xs text-slate-500">• {claim.patientDetails.name}</span>
                  <StatusBadge status={claim.status} size="sm" />
                </div>
                <Link
                  to={`/tpa/claims/${claim._id}`}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-brand-600 hover:text-brand-800"
                >
                  <span>Open Adjudication Page</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-500 block mb-1">Admitting Clinical Diagnosis:</span>
                <p className="font-semibold text-slate-800">{claim.admissionDetails.diagnosis}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REOPEN QUERY MODAL */}
      <Modal
        isOpen={!!reopenQueryId}
        onClose={() => setReopenQueryId(null)}
        title="Reopen Clarification Query"
        subtitle="Request additional information if previous hospital response was incomplete"
      >
        <form onSubmit={handleReopen} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Extended SLA Deadline *</label>
            <input
              type="datetime-local"
              required
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setReopenQueryId(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
            >
              Reopen Query
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
