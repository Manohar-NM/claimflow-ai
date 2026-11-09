import React, { useState, useMemo } from 'react';
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
  PlusCircle,
  Eye,
  ArrowUpDown,
  Calendar,
  Building2,
  Filter,
  X,
  FileText,
} from 'lucide-react';

export const HospitalClaimsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [tpaProvider, setTpaProvider] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortField, setSortField] = useState<'claimId' | 'name' | 'amount' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['hospital-claims', { search, status, tpaProvider, startDate, endDate }],
    queryFn: () =>
      claimsApi.getClaims({
        search: search.trim() || undefined,
        status: status !== 'ALL' ? status : undefined,
        tpaProvider: tpaProvider !== 'ALL' ? tpaProvider : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  const rawClaims = data?.data || [];

  // Client-side sortable columns
  const sortedClaims = useMemo(() => {
    return [...rawClaims].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'claimId') {
        comparison = a.claimId.localeCompare(b.claimId);
      } else if (sortField === 'name') {
        comparison = a.patientDetails.name.localeCompare(b.patientDetails.name);
      } else if (sortField === 'amount') {
        comparison = a.financialDetails.totalClaimedAmount - b.financialDetails.totalClaimedAmount;
      } else {
        comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [rawClaims, sortField, sortOrder]);

  const toggleSort = (field: 'claimId' | 'name' | 'amount' | 'date') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatus('ALL');
    setTpaProvider('ALL');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = search || status !== 'ALL' || tpaProvider !== 'ALL' || startDate || endDate;

  return (
    <div className="space-y-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-clinical">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Claims Workspace
            </h1>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700 border border-brand-200">
              {rawClaims.length} Claims
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, track pre-authorization statuses, and inspect clinical document extractions.
          </p>
        </div>
        <Link
          to="/hospital/claims/new"
          className="flex items-center space-x-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-500 transition-all shadow-clinical shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Cashless Claim</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-clinical space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Patient Name, Claim ID, Policy Number, Patient ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 px-3 text-xs font-semibold text-slate-700 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
            >
              <option value="ALL">All Claim Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted to TPA</option>
              <option value="TPA_REVIEW">Under TPA Review</option>
              <option value="QUERY_RAISED">Query Raised</option>
              <option value="APPROVED">Pre-Auth Approved</option>
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 px-3 text-xs font-semibold text-slate-700 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
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

        {/* Date Filter Row & Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              Admission Date Range:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1 text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-brand-500"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1 text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-brand-500"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center space-x-1 text-slate-500 hover:text-rose-600 font-semibold transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Claims Data Table */}
      {isLoading ? (
        <LoadingSkeleton rows={8} />
      ) : error ? (
        <ErrorState message="Failed to load claims list from database." onRetry={refetch} />
      ) : sortedClaims.length === 0 ? (
        <EmptyState
          title="No claims matching criteria"
          description="Try adjusting your search terms, status filters, or start a new patient claim draft."
          actionText="Create New Claim"
          onAction={() => navigate('/hospital/claims/new')}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-clinical overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 font-bold uppercase tracking-wider text-slate-500">
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => toggleSort('claimId')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Claim ID</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Patient Details</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">TPA & Policy</th>
                  <th className="py-3.5 px-4">Admission</th>
                  <th
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => toggleSort('amount')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Claimed Amt</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right">Approved Amt</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Last Updated</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedClaims.map((claim) => {
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
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/hospital/claims/${claim._id}`)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-700">
                        {claim.claimId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{claim.patientDetails.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {claim.patientDetails.age}y • {claim.patientDetails.gender} • ID: {claim.patientDetails.patientId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{claim.tpaProvider}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {claim.insuranceDetails.policyNumber}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{admissionDate}</div>
                        <div className="text-[11px] text-slate-500">{claim.admissionDetails.treatingDepartment}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        <CurrencyFormatter amount={claim.financialDetails.totalClaimedAmount} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">
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
                          className="inline-flex items-center space-x-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all shadow-clinical"
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
          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Showing {sortedClaims.length} patient claims</span>
            <span>Total Records in MongoDB: {data?.pagination?.total || sortedClaims.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};
