import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard';
import { claimsApi } from '../../api/claims';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CurrencyFormatter } from '../../components/common/CurrencyFormatter';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import {
  Inbox,
  Clock,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  Eye,
  FileText,
  Shield,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

export const TPADashboardPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tpa-dashboard'],
    queryFn: dashboardApi.getTPAMetrics,
    refetchInterval: 15000,
  });

  const { data: queueData } = useQuery({
    queryKey: ['tpa-incoming-preview'],
    queryFn: () => claimsApi.getClaims({ status: 'SUBMITTED', limit: 5 }),
    refetchInterval: 15000,
  });

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (error || !data) return <ErrorState message="Could not load TPA dashboard metrics." onRetry={refetch} />;

  const { metrics, financials, urgentQueries } = data;
  const incomingPreviewClaims = queueData?.data || [];

  const adjudicationData = [
    { name: 'Incoming', count: metrics.incomingClaims, color: '#2563EB' },
    { name: 'Under Review', count: metrics.pendingReview, color: '#6366F1' },
    { name: 'Query Raised', count: metrics.queryRaised, color: '#D97706' },
    { name: 'Approved', count: metrics.approved, color: '#16A34A' },
    { name: 'Sanctioned', count: metrics.sanctioned, color: '#0D9488' },
    { name: 'Settled', count: metrics.settled, color: '#059669' },
    { name: 'Rejected', count: metrics.rejected, color: '#DC2626' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-clinical">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              TPA Underwriting & Adjudication Desk
            </h1>
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-700 border border-teal-200">
              Adjudication Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cashless claim validation, ICD-10 medical code scrutiny, query SLAs, and sanction authorizations.
          </p>
        </div>
        <Link
          to="/tpa/queue"
          className="flex items-center space-x-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-500 transition-all shadow-clinical shrink-0"
        >
          <Inbox className="h-4 w-4" />
          <span>Open Review Queue ({metrics.incomingClaims + metrics.pendingReview})</span>
        </Link>
      </div>

      {/* Financial Authorization Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-clinical flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Requested Hospital Claims
            </span>
            <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
              <CurrencyFormatter amount={financials.totalRequestedAmount} />
            </div>
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">Incurred hospital pre-authorization bills</span>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 shadow-clinical flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              Total Authorized Pre-Auth
            </span>
            <div className="mt-2 text-2xl font-black text-indigo-700 tracking-tight">
              <CurrencyFormatter amount={financials.totalAuthorizedAmount} />
            </div>
          </div>
          <span className="text-[11px] text-indigo-600 mt-2 block">TPA approved underwriter limits</span>
        </div>

        <div className="rounded-2xl border border-teal-100 bg-teal-50/30 p-5 shadow-clinical flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
              Total Sanctioned Payouts
            </span>
            <div className="mt-2 text-2xl font-black text-teal-800 tracking-tight">
              <CurrencyFormatter amount={financials.totalSanctionedAmount} />
            </div>
          </div>
          <span className="text-[11px] text-teal-700 mt-2 block">Confirmed hospital cashless sanctions</span>
        </div>
      </div>

      {/* TPA Queue Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Incoming" value={metrics.incomingClaims} icon={Inbox} variant="blue" />
        <StatCard title="In Review" value={metrics.pendingReview} icon={Clock} variant="indigo" />
        <StatCard title="Query Raised" value={metrics.queryRaised} icon={HelpCircle} variant="amber" />
        <StatCard title="Approved" value={metrics.approved} icon={CheckCircle2} variant="emerald" />
        <StatCard title="Sanctioned" value={metrics.sanctioned} icon={ShieldCheck} variant="teal" />
        <StatCard title="Rejected" value={metrics.rejected} icon={XCircle} variant="rose" />
      </div>

      {/* Urgent SLA Deadlines Card */}
      {urgentQueries && urgentQueries.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-5 shadow-clinical">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <span>Active Queries Awaiting Hospital Clarification</span>
            </div>
            <Link to="/tpa/queries" className="text-xs font-bold text-amber-800 hover:text-amber-900">
              Manage All Queries →
            </Link>
          </div>
          <div className="space-y-2.5">
            {urgentQueries.map((q) => {
              const claimObj = q.claimId as any;
              const deadlineDate = new Date(q.deadline);
              const isOverdue = deadlineDate.getTime() < Date.now();

              return (
                <div
                  key={q._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl bg-white p-4 border border-amber-200 shadow-2xs gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {claimObj?.claimId}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        {claimObj?.patientDetails?.name}
                      </span>
                      <span className="text-xs font-medium text-slate-500">({claimObj?.tpaProvider})</span>
                    </div>
                    <p className="text-xs text-slate-700 italic line-clamp-1">"{q.queryText}"</p>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                        isOverdue
                          ? 'bg-rose-50 text-rose-800 border-rose-200 font-bold'
                          : 'bg-amber-100 text-amber-900 border-amber-200'
                      }`}
                    >
                      {isOverdue ? 'SLA Elapsed' : `Due: ${deadlineDate.toLocaleDateString('en-IN')}`}
                    </span>
                    <Link
                      to={`/tpa/claims/${claimObj?._id || claimObj}`}
                      className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-2xs"
                    >
                      Inspect Claim
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Incoming TPA Queue Mini-Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-clinical">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Incoming Claims Awaiting TPA Adjudication</h3>
            <p className="text-xs text-slate-500">Newly submitted hospital pre-authorization requests</p>
          </div>
          <Link
            to="/tpa/queue"
            className="flex items-center space-x-1 text-xs font-bold text-brand-600 hover:text-brand-700"
          >
            <span>Full Queue ({metrics.incomingClaims + metrics.pendingReview})</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {incomingPreviewClaims.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No incoming claims currently awaiting adjudication.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-4">Claim ID</th>
                  <th className="py-2.5 px-4">Patient Name</th>
                  <th className="py-2.5 px-4">TPA Provider</th>
                  <th className="py-2.5 px-4 text-right">Requested Bill</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incomingPreviewClaims.map((claim) => (
                  <tr key={claim._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-700">
                      {claim.claimId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {claim.patientDetails.name}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {claim.tpaProvider}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      <CurrencyFormatter amount={claim.financialDetails.totalClaimedAmount} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={claim.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/tpa/claims/${claim._id}`}
                        className="inline-flex items-center space-x-1 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-500 transition-colors shadow-clinical"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Adjudicate</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjudication Distribution Visual Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-clinical">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Underwriting Adjudication Pipeline</h3>
        <p className="text-xs text-slate-500 mb-4">Volume of claims by TPA adjudication outcome</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={adjudicationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip
                cursor={{ fill: '#F8FAFC' }}
                contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E2E8F0' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {adjudicationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
