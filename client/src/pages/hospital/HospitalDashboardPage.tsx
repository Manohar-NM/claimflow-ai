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
  FileText,
  Clock,
  HelpCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  PlusCircle,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export const HospitalDashboardPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['hospital-dashboard'],
    queryFn: dashboardApi.getHospitalMetrics,
    refetchInterval: 15000, // Real-time poll every 15s
  });

  if (isLoading) {
    return <LoadingSkeleton rows={8} />;
  }

  if (error || !data) {
    return <ErrorState message="Could not load hospital dashboard metrics." onRetry={refetch} />;
  }

  const { metrics, financials, pendingQueries, recentActivity } = data;

  const chartData = [
    { name: 'Draft', count: metrics.draftClaims, color: '#94a3b8' },
    { name: 'Submitted', count: metrics.submittedClaims, color: '#3b82f6' },
    { name: 'TPA Review', count: metrics.underReviewClaims, color: '#6366f1' },
    { name: 'Queries', count: metrics.queryRaisedClaims, color: '#f59e0b' },
    { name: 'Approved', count: metrics.approvedClaims, color: '#10b981' },
    { name: 'Sanctioned', count: metrics.sanctionedClaims, color: '#0d9488' },
    { name: 'Settled', count: metrics.settledClaims, color: '#047857' },
    { name: 'Rejected', count: metrics.rejectedClaims, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Claims Desk</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time cashless pre-authorization, TPA query resolution, and financial tracking.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/hospital/claims/new"
            className="flex items-center space-x-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-500 transition-all shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Cashless Claim</span>
          </Link>
          <Link
            to="/hospital/claims"
            className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
          >
            <span>View All Claims</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Claimed Value
          </span>
          <div className="mt-2 text-2xl font-black text-slate-900">
            <CurrencyFormatter amount={financials.totalClaimed} />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Sum of all submitted hospital bills</span>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Total Approved Amount
          </span>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            <CurrencyFormatter amount={financials.totalApproved} />
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block">Adjudicated by TPA partners</span>
        </div>

        <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">
            Total Sanctioned Limit
          </span>
          <div className="mt-2 text-2xl font-black text-teal-800">
            <CurrencyFormatter amount={financials.totalSanctioned} />
          </div>
          <span className="text-[11px] text-teal-700 mt-1 block">Active hospital cashless authorization</span>
        </div>
      </div>

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Total Claims" value={metrics.totalClaims} icon={FileText} variant="blue" />
        <StatCard title="Drafts" value={metrics.draftClaims} icon={Clock} variant="slate" />
        <StatCard title="Submitted" value={metrics.submittedClaims} icon={TrendingUp} variant="indigo" />
        <StatCard title="In Review" value={metrics.underReviewClaims} icon={Clock} variant="indigo" />
        <StatCard title="Queries" value={metrics.queryRaisedClaims} icon={HelpCircle} variant="amber" />
        <StatCard title="Approved" value={metrics.approvedClaims} icon={CheckCircle2} variant="emerald" />
      </div>

      {/* Urgent Pending Queries Alert Banner */}
      {pendingQueries && pendingQueries.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="h-5 w-5 text-amber-600 animate-bounce" />
              <span>Urgent TPA Clarification Queries Pending Response</span>
            </div>
            <span className="text-xs font-semibold text-amber-800 bg-amber-200/60 px-2.5 py-0.5 rounded-full">
              {pendingQueries.length} Action Required
            </span>
          </div>
          <div className="space-y-2">
            {pendingQueries.map((q) => {
              const claimObj = q.claimId as any;
              const deadlineDate = new Date(q.deadline);
              const isUrgent = deadlineDate.getTime() - Date.now() < 24 * 3600000;

              return (
                <div
                  key={q._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl bg-white p-3.5 border border-amber-200 shadow-2xs gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900">{claimObj?.claimId}</span>
                      <span className="text-xs text-slate-500">• {claimObj?.patientDetails?.name}</span>
                      <span className="text-xs text-slate-500 font-medium">({claimObj?.tpaProvider})</span>
                    </div>
                    <p className="text-xs text-slate-700 italic line-clamp-1">"{q.queryText}"</p>
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${
                        isUrgent ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Deadline: {deadlineDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <Link
                      to={`/hospital/claims/${claimObj?._id || claimObj}`}
                      className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-2xs"
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

      {/* Visual Analytics & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Claim Volume by Lifecycle Status</h3>
            <span className="text-xs text-slate-400">Live MongoDB Aggregation</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
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

        {/* Recent Audit Activity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Workspace Activity</h3>
            <Link to="/hospital/claims" className="text-xs font-semibold text-brand-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((log) => (
                <div key={log._id} className="flex items-start space-x-2.5 text-xs pb-2 border-b border-slate-100 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{log.action.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{log.details?.message || 'Activity updated'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No recent activity recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
