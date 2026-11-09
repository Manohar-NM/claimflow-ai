import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { claimsApi } from '../../api/claims';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CurrencyFormatter } from '../../components/common/CurrencyFormatter';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import {
  Search,
  Filter,
  Eye,
  Clock,
  ShieldCheck,
  AlertCircle,
  Inbox,
  ArrowRight,
  RefreshCw,
  Building2,
  FileCheck2,
  HelpCircle,
} from 'lucide-react';

export const TPAReviewQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [tpaProvider, setTpaProvider] = useState('ALL');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['tpa-queue', { search, status, tpaProvider }],
    queryFn: () =>
      claimsApi.getClaims({
        search: search.trim() || undefined,
        status: status !== 'ALL' ? status : undefined,
        tpaProvider: tpaProvider !== 'ALL' ? tpaProvider : undefined,
      }),
  });

  // Filter out DRAFT claims from TPA view if 'ALL' is selected
  const allClaims = data?.data || [];
  const claims =
    status === 'ALL'
      ? allClaims.filter((c) => c.status !== 'DRAFT')
      : allClaims;

  const countNew = allClaims.filter((c) => c.status === 'SUBMITTED').length;
  const countInReview = allClaims.filter((c) => c.status === 'TPA_REVIEW').length;
  const countQueries = allClaims.filter((c) => c.status === 'QUERY_RAISED').length;
  const countApproved = allClaims.filter((c) => c.status === 'APPROVED' || c.status === 'SANCTIONED').length;

  return (
    <div className="space-y-6">
      {/* Title & Quick Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">TPA Claims Review Queue</h1>
            <span className="rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-xs font-bold text-brand-700">
              {claims.length} {claims.length === 1 ? 'Claim' : 'Claims'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Incoming hospital cashless admissions awaiting medical adjudication, verification, and sanction letters.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-auto inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Mini status pill filter quick-toggles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatus('SUBMITTED')}
          className={`flex items-center justify-between rounded-xl p-3 border text-left transition-all ${
            status === 'SUBMITTED'
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-700">New Submissions</span>
          </div>
          <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
            {countNew}
          </span>
        </button>

        <button
          onClick={() => setStatus('TPA_REVIEW')}
          className={`flex items-center justify-between rounded-xl p-3 border text-left transition-all ${
            status === 'TPA_REVIEW'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
            <span className="text-xs font-bold text-slate-700">Under Review</span>
          </div>
          <span className="font-mono text-xs font-extrabold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md">
            {countInReview}
          </span>
        </button>

        <button
          onClick={() => setStatus('QUERY_RAISED')}
          className={`flex items-center justify-between rounded-xl p-3 border text-left transition-all ${
            status === 'QUERY_RAISED'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            <span className="text-xs font-bold text-slate-700">Query Raised</span>
          </div>
          <span className="font-mono text-xs font-extrabold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
            {countQueries}
          </span>
        </button>

        <button
          onClick={() => setStatus('APPROVED')}
          className={`flex items-center justify-between rounded-xl p-3 border text-left transition-all ${
            status === 'APPROVED'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold text-slate-700">Pre-Auth Approved</span>
          </div>
          <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
            {countApproved}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-clinical">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Patient Name, UHID, Claim ID, or Policy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-600 focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        <div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 px-3 text-xs font-medium text-slate-700 focus:border-brand-600 focus:bg-white focus:outline-none transition-colors"
          >
            <option value="ALL">All Active Queue (Excl. Drafts)</option>
            <option value="SUBMITTED">Submitted (New Incoming)</option>
            <option value="TPA_REVIEW">Under Active Review</option>
            <option value="QUERY_RAISED">Query Raised</option>
            <option value="APPROVED">Approved Pre-Auth</option>
            <option value="SANCTIONED">Sanctioned</option>
            <option value="SETTLED">Settled</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div>
          <select
            value={tpaProvider}
            onChange={(e) => setTpaProvider(e.target.value)}
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

      {/* Claims List Table */}
      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : error ? (
        <ErrorState message="Could not load TPA review queue." onRetry={refetch} />
      ) : claims.length === 0 ? (
        <EmptyState
          title="Review Queue is Empty"
          description="There are currently no hospital cashless claims matching your filter criteria in this queue."
          icon={Inbox}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-clinical overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                  <th className="py-3 px-4">Claim ID</th>
                  <th className="py-3 px-4">Patient & Details</th>
                  <th className="py-3 px-4">TPA & Policy</th>
                  <th className="py-3 px-4">Primary Diagnosis</th>
                  <th className="py-3 px-4 text-right">Requested</th>
                  <th className="py-3 px-4 text-right">Authorized</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map((claim) => {
                  const isSubmitted = claim.status === 'SUBMITTED';

                  return (
                    <tr
                      key={claim._id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/tpa/claims/${claim._id}`)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                        {claim.claimId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{claim.patientDetails.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {claim.patientDetails.age}y • {claim.patientDetails.gender} • UHID: {claim.patientDetails.patientId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-brand-700">{claim.tpaProvider}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {claim.insuranceDetails.policyNumber}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 line-clamp-1">
                          {claim.admissionDetails.diagnosis}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          ICD-10: <span className="text-slate-600 font-semibold">{claim.admissionDetails.primaryICD10 || 'Pending'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        <CurrencyFormatter amount={claim.financialDetails.totalClaimedAmount} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                        <CurrencyFormatter amount={claim.financialDetails.approvedAmount} />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={claim.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/tpa/claims/${claim._id}`}
                          className={`inline-flex items-center space-x-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-2xs ${
                            isSubmitted
                              ? 'bg-brand-600 text-white hover:bg-brand-500'
                              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{isSubmitted ? 'Adjudicate' : 'Review'}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {claims.length} claims in active queue</span>
            <span className="text-slate-400 text-[11px]">Click any row to open adjudication view</span>
          </div>
        </div>
      )}
    </div>
  );
};
