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
  PlusCircle,
  Eye,
  FileEdit,
  ArrowUpDown,
  Calendar,
  Building2,
} from 'lucide-react';

export const HospitalClaimsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [tpaProvider, setTpaProvider] = useState('ALL');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['hospital-claims', { search, status, tpaProvider }],
    queryFn: () =>
      claimsApi.getClaims({
        search: search.trim() || undefined,
        status: status !== 'ALL' ? status : undefined,
        tpaProvider: tpaProvider !== 'ALL' ? tpaProvider : undefined,
      }),
  });

  const claims = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Claims Workspace</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage hospital patient cashless admissions, pre-authorizations, and TPA submissions.
          </p>
        </div>
        <Link
          to="/hospital/claims/new"
          className="flex items-center space-x-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-500 transition-all shadow-sm shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Cashless Claim</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Search Input */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Patient Name, Claim ID, or Policy Number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 px-3 text-xs font-medium text-slate-700 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="ALL">All Claim Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="TPA_REVIEW">Under TPA Review</option>
            <option value="QUERY_RAISED">Query Raised</option>
            <option value="APPROVED">Approved</option>
            <option value="SANCTIONED">Sanctioned</option>
            <option value="SETTLED">Settled</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* TPA Provider Filter */}
        <div>
          <select
            value={tpaProvider}
            onChange={(e) => setTpaProvider(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 px-3 text-xs font-medium text-slate-700 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
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

      {/* Claims Data Table */}
      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : error ? (
        <ErrorState message="Failed to load claims list from database." onRetry={refetch} />
      ) : claims.length === 0 ? (
        <EmptyState
          title="No claims matching criteria"
          description="Try adjusting your search terms, status filter, or create a new cashless claim draft."
          actionText="Create New Claim"
          onAction={() => window.location.assign('/hospital/claims/new')}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Claim ID</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">TPA & Policy</th>
                  <th className="py-3 px-4">Admission</th>
                  <th className="py-3 px-4 text-right">Claimed Amt</th>
                  <th className="py-3 px-4 text-right">Approved Amt</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map((claim) => {
                  const admissionDate = new Date(claim.admissionDetails.admissionDate).toLocaleDateString(
                    'en-IN',
                    { month: 'short', day: 'numeric', year: 'numeric' }
                  );
                  const updatedDate = new Date(claim.updatedAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={claim._id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => window.location.assign(`/hospital/claims/${claim._id}`)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-700">
                        {claim.claimId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{claim.patientDetails.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {claim.patientDetails.age}y • {claim.patientDetails.gender} • ID: {claim.patientDetails.patientId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{claim.tpaProvider}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {claim.insuranceDetails.policyNumber}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>{admissionDate}</div>
                        <div className="text-[11px] text-slate-400">{claim.admissionDetails.treatingDepartment}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                        <CurrencyFormatter amount={claim.financialDetails.totalClaimedAmount} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-700">
                        <CurrencyFormatter amount={claim.financialDetails.approvedAmount} />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={claim.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                        {updatedDate}
                      </td>
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          to={`/hospital/claims/${claim._id}`}
                          className="inline-flex items-center space-x-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {claims.length} claims</span>
            <span>Total Records: {data?.pagination?.total || claims.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};
