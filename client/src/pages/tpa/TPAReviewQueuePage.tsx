import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';

export const TPAReviewQueuePage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [tpaProvider, setTpaProvider] = useState('ALL');

  const { data, isLoading, error, refetch } = useQuery({
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

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">TPA Claims Review Queue</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Incoming hospital submissions awaiting underwriter adjudication, query management, and sanction approvals.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Patient Name, Claim ID, or Policy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 px-3 text-xs font-medium text-slate-700 focus:border-brand-500 focus:bg-white focus:outline-none"
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
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 px-3 text-xs font-medium text-slate-700 focus:border-brand-500 focus:bg-white focus:outline-none"
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
          description="There are currently no hospital cashless claims pending underwriting in this queue."
          icon={Inbox}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Claim ID</th>
                  <th className="py-3 px-4">Patient & Hospital</th>
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
                      onClick={() => window.location.assign(`/tpa/claims/${claim._id}`)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
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
                        <div className="text-[11px] text-slate-400 font-mono">
                          ICD-10: {claim.admissionDetails.primaryICD10 || 'Pending'}
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
                          className={`inline-flex items-center space-x-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-2xs ${
                            isSubmitted
                              ? 'bg-brand-600 text-white hover:bg-brand-500'
                              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{isSubmitted ? 'Review' : 'Inspect'}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
