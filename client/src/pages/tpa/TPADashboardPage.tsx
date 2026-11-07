import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard';
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
  IndianRupee,
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

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (error || !data) return <ErrorState message="Could not load TPA dashboard metrics." onRetry={refetch} />;

  const { metrics, financials, urgentQueries } = data;

  const adjudicationData = [
    { name: 'Incoming', count: metrics.incomingClaims, color: '#3b82f6' },
    { name: 'Under Review', count: metrics.pendingReview, color: '#6366f1' },
    { name: 'Query Raised', count: metrics.queryRaised, color: '#f59e0b' },
    { name: 'Approved', count: metrics.approved, color: '#10b981' },
    { name: 'Sanctioned', count: metrics.sanctioned, color: '#0d9488' },
    { name: 'Settled', count: metrics.settled, color: '#047857' },
    { name: 'Rejected', count: metrics.rejected, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            TPA Underwriting & Adjudication Desk
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cashless claim validation, ICD-10 medical code scrutiny, query SLAs, and sanction authorizations.
          </p>
        </div>
        <Link
          to="/tpa/queue"
          className="flex items-center space-x-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-500 transition-all shadow-sm shrink-0"
        >
          <Inbox className="h-4 w-4" />
          <span>Open Review Queue ({metrics.incomingClaims + metrics.pendingReview})</span>
        </Link>
      </div>

      {/* Financial Authorization Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Requested Hospital Claims
          </span>
          <div className="mt-2 text-2xl font-black text-slate-900">
            <CurrencyFormatter amount={financials.totalRequestedAmount} />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Incurred hospital pre-authorization bills</span>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Total Authorized Pre-Auth
          </span>
          <div className="mt-2 text-2xl font-black text-indigo-700">
            <CurrencyFormatter amount={financials.totalAuthorizedAmount} />
          </div>
          <span className="text-[11px] text-indigo-600 mt-1 block">TPA approved underwriter limits</span>
        </div>

        <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">
            Total Sanctioned Payouts
          </span>
          <div className="mt-2 text-2xl font-black text-teal-800">
            <CurrencyFormatter amount={financials.totalSanctionedAmount} />
          </div>
          <span className="text-[11px] text-teal-700 mt-1 block">Confirmed hospital cashless sanctions</span>
        </div>
      </div>

      {/* TPA Queue Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Incoming" value={metrics.incomingClaims} icon={Inbox} variant="blue" />
        <StatCard title="In Review" value={metrics.pendingReview} icon={Clock} variant="indigo" />
        <StatCard title="Query Raised" value={metrics.queryRaised} icon={HelpCircle} variant="amber" />
        <StatCard title="Approved" value={metrics.approved} icon={CheckCircle2} variant="emerald" />
        <StatCard title="Sanctioned" value={metrics.sanctioned} icon={ShieldCheck} variant="emerald" />
        <StatCard title="Rejected" value={metrics.rejected} icon={XCircle} variant="rose" />
      </div>

      {/* Urgent SLA Deadlines Card */}
      {urgentQueries && urgentQueries.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span>Active Queries Awaiting Hospital Clarification</span>
            </div>
            <Link to="/tpa/queries" className="text-xs font-bold text-amber-800 hover:underline">
              Manage All Queries →
            </Link>
          </div>
          <div className="space-y-2">
            {urgentQueries.map((q) => {
              const claimObj = q.claimId as any;
              const deadlineDate = new Date(q.deadline);
              const isOverdue = deadlineDate.getTime() < Date.now();

              return (
                <div
                  key={q._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl bg-white p-3.5 border border-amber-200 shadow-2xs gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900">{claimObj?.claimId}</span>
                      <span className="text-xs text-slate-500">• {claimObj?.patientDetails?.name}</span>
                      <span className="text-xs font-medium text-slate-600">({claimObj?.tpaProvider})</span>
                    </div>
                    <p className="text-xs text-slate-700 italic line-clamp-1">"{q.queryText}"</p>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${
                        isOverdue ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {isOverdue ? 'SLA Elapsed' : `Due: ${deadlineDate.toLocaleDateString()}`}
                    </span>
                    <Link
                      to={`/tpa/claims/${claimObj?._id || claimObj}`}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
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

      {/* Adjudication Distribution Visual Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Underwriting Adjudication Pipeline</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={adjudicationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
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
