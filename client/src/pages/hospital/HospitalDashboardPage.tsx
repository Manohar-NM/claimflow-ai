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
  FileText,
  Clock,
  HelpCircle,
  CheckCircle2,
  TrendingUp,
  PlusCircle,
  ArrowUpRight,
  AlertTriangle,
  Building2,
  Calendar,
  Activity,
  Shield,
  Eye,
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

export const HospitalDashboardPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['hospital-dashboard'],
    queryFn: dashboardApi.getHospitalMetrics,
    refetchInterval: 15000,
  });

  const { data: claimsData } = useQuery({
    queryKey: ['hospital-recent-claims'],
    queryFn: () => claimsApi.getClaims({ limit: 5 }),
    refetchInterval: 15000,
  });

  if (isLoading) {
    return <LoadingSkeleton rows={8} />;
  }

  if (error || !data) {
    return <ErrorState message="Could not load hospital dashboard metrics." onRetry={refetch} />;
  }

  const { metrics, financials, pendingQueries, recentActivity } = data;
  const recentClaims = claimsData?.data || [];

  const chartData = [
    { name: 'Draft', count: metrics.draftClaims, color: '#94A3B8' },
    { name: 'Submitted', count: metrics.submittedClaims, color: '#2563EB' },
    { name: 'In Review', count: metrics.underReviewClaims, color: '#6366F1' },
    { name: 'Query', count: metrics.queryRaisedClaims, color: '#D97706' },
    { name: 'Approved', count: metrics.approvedClaims, color: '#16A34A' },
    { name: 'Sanctioned', count: metrics.sanctionedClaims, color: '#0D9488' },
    { name: 'Settled', count: metrics.settledClaims, color: '#059669' },
    { name: 'Rejected', count: metrics.rejectedClaims, color: '#DC2626' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-clinical">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Hospital Cashless Desk
            </h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              Live Gateway
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time pre-authorization pipeline, TPA SLA compliance, and cashless settlement tracking.
          </p>
        </div>
        <div className="flex items-center space-x-2.5 shrink-0">
          <Link
            to="/hospital/claims/new"
            className="flex items-center space-x-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-500 transition-all shadow-clinical"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create New Claim</span>
          </Link>
          <Link
            to="/hospital/claims"
            className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-all shadow-clinical"
          >
            <span>Claims Workspace</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <StatCard title="Total Claims" value={metrics.totalClaims} icon={FileText} variant="blue" />
        <StatCard title="Drafts" value={metrics.draftClaims} icon={Clock} variant="slate" />
        <StatCard title="Submitted" value={metrics.submittedClaims} icon={TrendingUp} variant="indigo" />
        <StatCard title="Under Review" value={metrics.underReviewClaims} icon={Activity} variant="indigo" />
        <StatCard title="Queries Raised" value={metrics.queryRaisedClaims} icon={HelpCircle} variant="amber" />
        <StatCard title="Approved" value={metrics.approvedClaims} icon={CheckCircle2} variant="emerald" />
        <StatCard
          title="Sanctioned Amt"
          value={`₹${(financials.totalSanctioned / 1000).toFixed(0)}k`}
          subtitle={`₹${financials.totalSanctioned.toLocaleString('en-IN')}`}
          icon={Shield}
          variant="teal"
        />
      </div>

      {/* Financial Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-clinical flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Incurred Bill Value
            </span>
            <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
              <CurrencyFormatter amount={financials.totalClaimed} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Cumulative across 12 claims</span>
            <span className="text-brand-600 font-semibold">100% Claimed</span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5 shadow-clinical flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Approved Pre-Authorizations
            </span>
            <div className="mt-2 text-2xl font-black text-emerald-700 tracking-tight">
              <CurrencyFormatter amount={financials.totalApproved} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
            <span>Adjudicated by TPA underwriter</span>
            <span className="font-bold">
              {financials.totalClaimed > 0
                ? `${((financials.totalApproved / financials.totalClaimed) * 100).toFixed(1)}% Conversion`
                : '—'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-teal-100 bg-teal-50/30 p-5 shadow-clinical flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
              Active Cashless Sanction Limit
            </span>
            <div className="mt-2 text-2xl font-black text-teal-800 tracking-tight">
              <CurrencyFormatter amount={financials.totalSanctioned} />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-teal-100 flex items-center justify-between text-xs text-teal-800">
            <span>Hospital cashless coverage locked</span>
            <span className="font-bold">Authorized</span>
          </div>
        </div>
      </div>

      {/* Urgent Pending Queries Alert Banner */}
      {pendingQueries && pendingQueries.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-5 shadow-clinical">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <span>Pending TPA Queries Requiring Action</span>
            </div>
            <span className="self-start sm:self-auto text-xs font-bold text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full border border-amber-300">
              {pendingQueries.length} Query Awaiting Response
            </span>
          </div>
          <div className="space-y-2.5">
            {pendingQueries.map((q) => {
              const claimObj = q.claimId as any;
              const deadlineDate = new Date(q.deadline);
              const isUrgent = deadlineDate.getTime() - Date.now() < 24 * 3600000;

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
                      <span className="text-xs text-slate-500 font-medium">
                        ({claimObj?.tpaProvider})
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 italic line-clamp-1">"{q.queryText}"</p>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                        isUrgent
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      Deadline: {deadlineDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <Link
                      to={`/hospital/claims/${claimObj?._id || claimObj}`}
                      className="rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-2xs"
                    >
                      Respond Now
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analytics & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-clinical">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Claims Volume by Pipeline Stage</h3>
              <p className="text-xs text-slate-500">Live MongoDB Aggregation</p>
            </div>
            <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
              {metrics.totalClaims} Total
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{
                    borderRadius: 12,
                    fontSize: 12,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Workspace Activity Feed */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-clinical flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Recent Workspace Activity</h3>
              <Link to="/hospital/claims" className="text-xs font-bold text-brand-600 hover:text-brand-700">
                View All
              </Link>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((log) => (
                  <div key={log._id} className="flex items-start space-x-2.5 text-xs pb-2.5 border-b border-slate-100 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-brand-600 mt-1.5 shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 truncate">{log.action.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{log.details?.message || 'Activity registered'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center">No recent activity recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Claims Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-clinical">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Patient Claims</h3>
            <p className="text-xs text-slate-500">Quick view of newest patient admissions in workspace</p>
          </div>
          <Link
            to="/hospital/claims"
            className="flex items-center space-x-1 text-xs font-bold text-brand-600 hover:text-brand-700"
          >
            <span>All Claims ({metrics.totalClaims})</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-4">Claim ID</th>
                <th className="py-2.5 px-4">Patient Name</th>
                <th className="py-2.5 px-4">TPA Provider</th>
                <th className="py-2.5 px-4 text-right">Claimed Value</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentClaims.map((claim) => (
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
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    <CurrencyFormatter amount={claim.financialDetails.totalClaimedAmount} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={claim.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Link
                      to={`/hospital/claims/${claim._id}`}
                      className="inline-flex items-center space-x-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
