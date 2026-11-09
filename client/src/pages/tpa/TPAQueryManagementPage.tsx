import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { claimsApi } from '../../api/claims';
import { queriesApi } from '../../api/queries';
import { dashboardApi } from '../../api/dashboard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CurrencyFormatter } from '../../components/common/CurrencyFormatter';
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
  RefreshCw,
  Building2,
  FileText,
  AlertCircle,
  User,
  Shield,
} from 'lucide-react';

export const TPAQueryManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tpaFilter, setTpaFilter] = useState('ALL');
  const [reopenQueryId, setReopenQueryId] = useState<string | null>(null);
  const [newDeadline, setNewDeadline] = useState(
    new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16)
  );
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch claims with queries
  const { data: claimsData, isLoading: claimsLoading, error: claimsError, refetch: refetchClaims, isFetching } = useQuery({
    queryKey: ['tpa-queries-claims'],
    queryFn: () => claimsApi.getClaims({ status: 'QUERY_RAISED' }),
  });

  // Also fetch urgent queries from TPA dashboard for richer query detail
  const { data: tpaMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['tpa-metrics-queries'],
    queryFn: () => dashboardApi.getTPAMetrics(),
  });

  const claims = claimsData?.data || [];
  const urgentQueries = tpaMetrics?.urgentQueries || [];

  const handleRefresh = () => {
    refetchClaims();
    refetchMetrics();
  };

  const handleResolve = async (queryId: string) => {
    try {
      await queriesApi.resolveQuery(queryId);
      handleRefresh();
      setToastMessage({ type: 'success', text: 'Query marked as resolved. Claim status updated.' });
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to resolve query.' });
    }
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenQueryId) return;
    try {
      await queriesApi.reopenQuery(reopenQueryId, new Date(newDeadline).toISOString());
      handleRefresh();
      setReopenQueryId(null);
      setToastMessage({ type: 'success', text: 'Query reopened with extended SLA deadline.' });
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reopen query.' });
    }
  };

  // Filter claims
  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      !search.trim() ||
      claim.claimId.toLowerCase().includes(search.toLowerCase()) ||
      claim.patientDetails.name.toLowerCase().includes(search.toLowerCase()) ||
      claim.patientDetails.patientId.toLowerCase().includes(search.toLowerCase()) ||
      claim.insuranceDetails.policyNumber.toLowerCase().includes(search.toLowerCase());

    const matchesTpa = tpaFilter === 'ALL' || claim.tpaProvider === tpaFilter;

    return matchesSearch && matchesTpa;
  });

  // Calculate SLA countdown status
  const getSlaIndicator = (deadlineStr: string) => {
    const diffHours = (new Date(deadlineStr).getTime() - Date.now()) / (1000 * 60 * 60);
    if (diffHours < 0) {
      return {
        text: `Overdue by ${Math.abs(Math.round(diffHours))}h`,
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: AlertTriangle,
      };
    }
    if (diffHours <= 6) {
      return {
        text: `Critical: ${Math.round(diffHours)}h remaining`,
        color: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: AlertCircle,
      };
    }
    return {
      text: `${Math.round(diffHours)}h remaining`,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: Clock,
    };
  };

  return (
    <div className="space-y-6">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">TPA Query Management Desk</h1>
            <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800">
              {claims.length} Active {claims.length === 1 ? 'Query' : 'Queries'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track outstanding medical documentation clarifications, evaluate hospital replies, and manage SLA deadlines.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="self-start sm:self-auto inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh Desk</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-xs font-semibold shadow-xs ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600 text-base font-bold">
            ×
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-clinical">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Claim ID, Patient Name, UHID, or Policy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-600 focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        <div>
          <select
            value={tpaFilter}
            onChange={(e) => setTpaFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 px-3 text-xs font-medium text-slate-700 focus:border-brand-600 focus:bg-white focus:outline-none transition-colors"
          >
            <option value="ALL">All TPA Providers</option>
            <option value="Star Health">Star Health</option>
            <option value="Medi Assist">Medi Assist</option>
            <option value="Niva Bupa">Niva Bupa</option>
            <option value="HDFC ERGO">HDFC ERGO</option>
            <option value="ICICI Lombard">ICICI Lombard</option>
          </select>
        </div>
      </div>

      {/* Query List */}
      {claimsLoading ? (
        <LoadingSkeleton rows={6} />
      ) : claimsError ? (
        <ErrorState message="Could not load queries desk." onRetry={handleRefresh} />
      ) : filteredClaims.length === 0 ? (
        <EmptyState
          title="No Open TPA Queries"
          description={
            search || tpaFilter !== 'ALL'
              ? 'No clarification queries match your search or filter criteria.'
              : 'All hospital cashless clarification queries have been resolved or are in review.'
          }
          icon={HelpCircle}
        />
      ) : (
        <div className="space-y-4">
          {filteredClaims.map((claim) => {
            // Check if there is an urgent query associated with this claim
            const matchingUrgentQuery = urgentQueries.find((q) => q.claimId === claim._id);
            const sla = matchingUrgentQuery ? getSlaIndicator(matchingUrgentQuery.deadline) : null;

            return (
              <div
                key={claim._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-clinical space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center flex-wrap gap-2.5">
                    <span className="font-mono font-bold text-slate-900 text-sm">{claim.claimId}</span>
                    <StatusBadge status={claim.status} size="sm" />
                    <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 border border-brand-200">
                      {claim.tpaProvider}
                    </span>
                    {sla && (
                      <span className={`inline-flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded border ${sla.color}`}>
                        <sla.icon className="h-3 w-3" />
                        <span>{sla.text}</span>
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/tpa/claims/${claim._id}`}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-brand-600 hover:text-brand-800 transition-colors"
                  >
                    <span>Open Adjudication Page</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Patient and Clinical Meta Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200">
                    <span className="text-slate-400 block mb-0.5 text-[11px]">Patient Details</span>
                    <p className="font-semibold text-slate-900">{claim.patientDetails.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {claim.patientDetails.age}y • {claim.patientDetails.gender} • UHID: {claim.patientDetails.patientId}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200">
                    <span className="text-slate-400 block mb-0.5 text-[11px]">Admitting Diagnosis</span>
                    <p className="font-semibold text-slate-900 line-clamp-1">{claim.admissionDetails.diagnosis}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      ICD-10: <span className="font-semibold text-slate-700">{claim.admissionDetails.primaryICD10 || 'Pending'}</span>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200">
                    <span className="text-slate-400 block mb-0.5 text-[11px]">Claimed Financials</span>
                    <div className="font-bold text-slate-900 text-sm">
                      <CurrencyFormatter amount={claim.financialDetails.totalClaimedAmount} />
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Policy: {claim.insuranceDetails.policyNumber}
                    </p>
                  </div>
                </div>

                {/* Query Body (if available from urgentQueries or display placeholder) */}
                {matchingUrgentQuery && (
                  <div className="space-y-2 text-xs">
                    <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-amber-900 flex items-center space-x-1">
                          <HelpCircle className="h-3.5 w-3.5 text-amber-700" />
                          <span>Clarification Query to Hospital:</span>
                        </span>
                        <span className="text-[11px] text-amber-700">
                          Deadline: {new Date(matchingUrgentQuery.deadline).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium">{matchingUrgentQuery.queryText}</p>
                    </div>

                    {matchingUrgentQuery.responseText && (
                      <div className="p-3.5 bg-brand-50/60 rounded-xl border border-brand-200">
                        <span className="font-bold text-brand-900 block mb-0.5">Hospital Response:</span>
                        <p className="text-slate-800">{matchingUrgentQuery.responseText}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Query Resolution Controls */}
                <div className="flex items-center justify-end space-x-2 pt-2">
                  {matchingUrgentQuery && (
                    <>
                      <button
                        onClick={() => handleResolve(matchingUrgentQuery._id)}
                        className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-2xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Resolve Query</span>
                      </button>

                      <button
                        onClick={() => setReopenQueryId(matchingUrgentQuery._id)}
                        className="inline-flex items-center space-x-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-amber-700" />
                        <span>Extend / Reopen</span>
                      </button>
                    </>
                  )}

                  <Link
                    to={`/tpa/claims/${claim._id}`}
                    className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <span>Full Adjudication</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                </div>
              </div>
            );
          })}
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
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:border-brand-600 focus:outline-none transition-colors"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setReopenQueryId(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-xs"
            >
              Confirm Reopen Query
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
