import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { claimsApi } from '../../api/claims';
import { queriesApi } from '../../api/queries';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CurrencyFormatter } from '../../components/common/CurrencyFormatter';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { Modal } from '../../components/common/Modal';
import { DocumentViewerModal } from '../../components/common/DocumentViewerModal';
import { AuditTimeline } from '../../components/common/AuditTimeline';
import { DocumentItem } from '../../types';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Eye,
  FileText,
  AlertTriangle,
  Clock,
  User,
  Shield,
  Stethoscope,
  IndianRupee,
  Send,
  AlertCircle,
  ArrowRight,
  Calendar,
  Building2,
  Activity,
  Layers,
  Info,
} from 'lucide-react';

export const TPAClaimReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'review' | 'documents' | 'queries' | 'audit'>('review');
  const [selectedDocForView, setSelectedDocForView] = useState<DocumentItem | null>(null);

  // Modals state
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [authorizedAmount, setAuthorizedAmount] = useState<number>(0);
  const [approvalRemarks, setApprovalRemarks] = useState('');

  const [isSanctionModalOpen, setIsSanctionModalOpen] = useState(false);
  const [sanctionAmount, setSanctionAmount] = useState<number>(0);
  const [sanctionRemarks, setSanctionRemarks] = useState('');

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [queryDeadline, setQueryDeadline] = useState(
    new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16)
  );

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['claim-details', id],
    queryFn: () => claimsApi.getClaimById(id!),
    enabled: !!id,
    refetchInterval: 10000,
  });

  const claimData = data?.data;
  const claim = claimData?.claim;
  const documents = claimData?.documents || [];
  const aiExtractions = claimData?.aiExtractions || [];
  const latestExtraction = aiExtractions[0];
  const queries = claimData?.queries || [];
  const auditLogs = claimData?.auditLogs || [];
  const financialValidation = claimData?.financialValidation;

  // Start review mutation
  const startReviewMutation = useMutation({
    mutationFn: () => claimsApi.startReview(claim!._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim-details', id] });
      setToastMessage({ type: 'success', text: 'Claim assigned and moved to Under TPA Review status.' });
    },
    onError: (err: any) => {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to start review.' });
    },
  });

  // Approve claim mutation
  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim) return;
    try {
      await claimsApi.approveClaim(claim._id, Number(authorizedAmount), approvalRemarks);
      queryClient.invalidateQueries({ queryKey: ['claim-details', id] });
      setIsApproveModalOpen(false);
      setToastMessage({ type: 'success', text: `Pre-authorization approved for ₹${authorizedAmount.toLocaleString('en-IN')}` });
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Approval failed.' });
    }
  };

  // Sanction claim mutation
  const handleSanction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim) return;
    try {
      await claimsApi.sanctionClaim(claim._id, Number(sanctionAmount), sanctionRemarks);
      queryClient.invalidateQueries({ queryKey: ['claim-details', id] });
      setIsSanctionModalOpen(false);
      setToastMessage({ type: 'success', text: `Cashless sanction limit issued for ₹${sanctionAmount.toLocaleString('en-IN')}` });
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Sanction failed.' });
    }
  };

  // Settle claim mutation
  const handleSettle = async () => {
    if (!claim) return;
    try {
      await claimsApi.settleClaim(claim._id);
      queryClient.invalidateQueries({ queryKey: ['claim-details', id] });
      setToastMessage({ type: 'success', text: 'Claim settlement completed and recorded.' });
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Settlement failed.' });
    }
  };

  // Reject claim mutation
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim || !rejectionReason.trim()) return;
    try {
      await claimsApi.rejectClaim(claim._id, rejectionReason);
      queryClient.invalidateQueries({ queryKey: ['claim-details', id] });
      setIsRejectModalOpen(false);
      setToastMessage({ type: 'error', text: 'Claim rejected with mandatory justification recorded in audit log.' });
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Rejection failed.' });
    }
  };

  // Raise query mutation
  const handleRaiseQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim || !queryText.trim() || !queryDeadline) return;
    try {
      await queriesApi.createQuery(claim._id, queryText, new Date(queryDeadline).toISOString());
      queryClient.invalidateQueries({ queryKey: ['claim-details', id] });
      setIsQueryModalOpen(false);
      setQueryText('');
      setToastMessage({ type: 'success', text: 'Clarification query raised with SLA deadline. Hospital notified.' });
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to raise query.' });
    }
  };

  if (isLoading) return <LoadingSkeleton rows={10} />;
  if (error || !claim) return <ErrorState message="Could not load claim review." onRetry={refetch} />;

  const isSubmitted = claim.status === 'SUBMITTED';
  const isInReview = claim.status === 'TPA_REVIEW';
  const isApproved = claim.status === 'APPROVED';
  const isSanctioned = claim.status === 'SANCTIONED';

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'TPA Queue', path: '/tpa/queue' },
          { label: `Adjudication: ${claim.claimId}` },
        ]}
      />

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

      {/* Underwriter Adjudication Top Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-clinical flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 font-mono tracking-tight">{claim.claimId}</h1>
            <StatusBadge status={claim.status} size="lg" />
            <span className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 border border-brand-200">
              {claim.tpaProvider}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Patient: <strong className="text-slate-800">{claim.patientDetails.name}</strong> • UHID:{' '}
            <strong className="text-slate-800 font-mono">{claim.patientDetails.patientId}</strong> • Policy No:{' '}
            <strong className="text-slate-800 font-mono">{claim.insuranceDetails.policyNumber}</strong>
          </p>
        </div>

        {/* Adjudication Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {isSubmitted && (
            <button
              onClick={() => startReviewMutation.mutate()}
              disabled={startReviewMutation.isPending}
              className="flex items-center space-x-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-500 transition-all shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{startReviewMutation.isPending ? 'Assigning...' : 'Take Under Review'}</span>
            </button>
          )}

          {isInReview && (
            <>
              <button
                onClick={() => {
                  setAuthorizedAmount(claim.financialDetails.totalClaimedAmount);
                  setIsApproveModalOpen(true);
                }}
                className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve Pre-Auth</span>
              </button>

              <button
                onClick={() => setIsQueryModalOpen(true)}
                className="flex items-center space-x-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-all shadow-sm"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Raise Query</span>
              </button>

              <button
                onClick={() => setIsRejectModalOpen(true)}
                className="flex items-center space-x-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all shadow-2xs"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject Claim</span>
              </button>
            </>
          )}

          {isApproved && (
            <button
              onClick={() => {
                setSanctionAmount(claim.financialDetails.approvedAmount || claim.financialDetails.totalClaimedAmount);
                setIsSanctionModalOpen(true);
              }}
              className="flex items-center space-x-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-500 transition-all shadow-sm"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Issue Cashless Sanction</span>
            </button>
          )}

          {isSanctioned && (
            <button
              onClick={handleSettle}
              className="flex items-center space-x-1.5 rounded-xl bg-green-700 px-4 py-2 text-xs font-bold text-white hover:bg-green-800 transition-all shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirm & Settle Payout</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 text-xs font-semibold">
        {[
          { key: 'review', label: 'Adjudication & Verification', icon: Stethoscope },
          { key: 'documents', label: `Hospital Documents (${documents.length})`, icon: FileText },
          { key: 'queries', label: `Query History (${queries.length})`, icon: HelpCircle },
          { key: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 py-3 px-4 border-b-2 transition-all ${
                isActive
                  ? 'border-brand-600 text-brand-700 font-bold bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ADJUDICATION & VERIFICATION */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          {/* Financial Validation & Policy Cap Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-clinical">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Claimed</span>
              <div className="mt-1 text-xl font-black text-slate-900">
                <CurrencyFormatter amount={claim.financialDetails.totalClaimedAmount} />
              </div>
              <span className="text-[10px] text-slate-400">Hospital Requested Bill</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-clinical">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Policy Limit</span>
              <div className="mt-1 text-xl font-black text-slate-900">
                <CurrencyFormatter amount={claim.insuranceDetails.policyCoverageLimit} />
              </div>
              <span className="text-[10px] text-slate-400">Contractual Max Cap</span>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-clinical">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Authorized Pre-Auth</span>
              <div className="mt-1 text-xl font-black text-emerald-800">
                <CurrencyFormatter amount={claim.financialDetails.approvedAmount} />
              </div>
              <span className="text-[10px] text-emerald-600">Underwriter Approved</span>
            </div>

            <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 shadow-clinical">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">Cashless Sanction</span>
              <div className="mt-1 text-xl font-black text-teal-900">
                <CurrencyFormatter amount={claim.financialDetails.sanctionedAmount} />
              </div>
              <span className="text-[10px] text-teal-700">Final Sanction Letter</span>
            </div>
          </div>

          {/* Clinical Verification Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-clinical space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
              <Stethoscope className="h-4 w-4 text-brand-600" />
              <span>Clinical Coding & Procedural Scrutiny</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1">Admitting Clinical Diagnosis:</span>
                  <p className="font-semibold text-slate-900 text-sm">{claim.admissionDetails.diagnosis}</p>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-slate-500">Primary ICD-10 Code:</span>
                  <span className="font-mono font-bold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-md border border-brand-200 text-xs">
                    {claim.admissionDetails.primaryICD10 || 'Missing'}
                  </span>
                </div>

                {claim.admissionDetails.secondaryICD10 && claim.admissionDetails.secondaryICD10.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">Secondary ICD Codes:</span>
                    {claim.admissionDetails.secondaryICD10.map((c, i) => (
                      <span key={i} className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1">Treating Department & Physician:</span>
                  <p className="font-semibold text-slate-900">
                    {claim.admissionDetails.treatingDepartment} • {claim.admissionDetails.doctorName}
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-slate-500">
                    Admission Date:{' '}
                    <span className="font-semibold text-slate-800">
                      {new Date(claim.admissionDetails.admissionDate).toLocaleDateString()}
                    </span>
                  </div>
                  {claim.admissionDetails.dischargeDate && (
                    <div className="text-slate-500">
                      Discharge:{' '}
                      <span className="font-semibold text-slate-800">
                        {new Date(claim.admissionDetails.dischargeDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {claim.admissionDetails.cptCodes && claim.admissionDetails.cptCodes.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">CPT Procedure Codes:</span>
                    {claim.admissionDetails.cptCodes.map((cpt, i) => (
                      <span key={i} className="font-mono font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200 text-xs">
                        {cpt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Extraction Scrutiny & Grounding */}
          {latestExtraction && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-clinical space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    AI Scrutiny & Calibrated Confidence
                  </span>
                  <span className="rounded bg-teal-50 px-2 py-0.5 font-mono text-[11px] font-bold text-teal-700 border border-teal-200">
                    {latestExtraction.model}
                  </span>
                </div>
                {latestExtraction.requiresManualReview ? (
                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    <span>Uncertain Fields Flagged</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Clinical Criteria Satisfied</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Patient Match', field: latestExtraction.extractedFields?.patientName },
                  { label: 'Policy Verification', field: latestExtraction.extractedFields?.policyNumber },
                  { label: 'Diagnosis Match', field: latestExtraction.extractedFields?.diagnosis },
                  { label: 'Claimed Bill Match', field: latestExtraction.extractedFields?.claimedAmount },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs">
                    <span className="text-slate-400 block mb-1">{item.label}</span>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                        {item.field?.value ? String(item.field.value) : '—'}
                      </span>
                      <span
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          (item.field?.confidence ?? 0) >= 0.80
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {((item.field?.confidence ?? 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Itemized Billing Breakdown */}
          {claim.financialDetails && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-clinical space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                <IndianRupee className="h-4 w-4 text-brand-600" />
                <span>Hospital Itemized Billing Scrutiny</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Room Charges</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    <CurrencyFormatter amount={claim.financialDetails.roomCharges || 0} />
                  </span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Procedure Charges</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    <CurrencyFormatter amount={claim.financialDetails.procedureCharges || 0} />
                  </span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Pharmacy & Meds</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    <CurrencyFormatter amount={claim.financialDetails.medicineCharges || 0} />
                  </span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Investigations</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    <CurrencyFormatter amount={claim.financialDetails.investigationCharges || 0} />
                  </span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Other Charges</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    <CurrencyFormatter amount={claim.financialDetails.otherCharges || 0} />
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Hospital Submitted Medical Documentation</h3>
          {documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-white text-xs text-slate-400 shadow-clinical">
              No documents available.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div key={doc._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-clinical flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {doc.documentType.replace(/_/g, ' ')}
                    </span>
                    <h4 className="mt-2 text-xs font-bold text-slate-900 truncate">{doc.originalName}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {(doc.fileSize / 1024).toFixed(1)} KB • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDocForView(doc)}
                    className="flex items-center justify-center space-x-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-500" />
                    <span>View & Inspect Document</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: QUERIES */}
      {activeTab === 'queries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">TPA Clarification Queries</h3>
            {isInReview && (
              <button
                onClick={() => setIsQueryModalOpen(true)}
                className="flex items-center space-x-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-xs"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Raise New Query</span>
              </button>
            )}
          </div>

          {queries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-white text-xs text-slate-400 shadow-clinical">
              No queries raised.
            </div>
          ) : (
            <div className="space-y-4">
              {queries.map((q) => (
                <div key={q._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-clinical space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={q.status} size="sm" />
                    <span className="font-semibold text-slate-500 flex items-center space-x-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Deadline: {new Date(q.deadline).toLocaleString()}</span>
                    </span>
                  </div>
                  <p className="text-slate-900 font-medium bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                    "{q.queryText}"
                  </p>
                  {q.responseText && (
                    <div className="p-3.5 bg-brand-50/60 rounded-xl border border-brand-200 text-slate-800">
                      <span className="font-bold text-brand-800 block mb-0.5">Hospital Response:</span>
                      {q.responseText}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-clinical">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Regulatory Adjudication Trail</h3>
          <AuditTimeline logs={auditLogs} />
        </div>
      )}

      {/* APPROVE CLAIM MODAL */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Approve Cashless Pre-Authorization"
        subtitle="Authorize admissible cashless insurance amount for this hospital claim"
      >
        <form onSubmit={handleApprove} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Authorized Pre-Auth Amount (₹ INR) *
            </label>
            <input
              type="number"
              required
              min={1}
              max={claim.financialDetails.totalClaimedAmount}
              value={authorizedAmount}
              onChange={(e) => setAuthorizedAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-900 focus:border-brand-600 focus:outline-none transition-colors"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Max allowable: ₹{claim.financialDetails.totalClaimedAmount.toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Underwriter Adjudication Remarks
            </label>
            <textarea
              rows={3}
              value={approvalRemarks}
              onChange={(e) => setApprovalRemarks(e.target.value)}
              placeholder="e.g. Approved as per GIPSA PPN package rates."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:border-brand-600 focus:outline-none transition-colors"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsApproveModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-xs"
            >
              Confirm Pre-Auth Approval
            </button>
          </div>
        </form>
      </Modal>

      {/* SANCTION MODAL */}
      <Modal
        isOpen={isSanctionModalOpen}
        onClose={() => setIsSanctionModalOpen(false)}
        title="Issue Cashless Sanction Letter"
        subtitle="Record formal sanction amount for cashless admission"
      >
        <form onSubmit={handleSanction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sanctioned Amount (₹ INR) *
            </label>
            <input
              type="number"
              required
              min={1}
              value={sanctionAmount}
              onChange={(e) => setSanctionAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-bold text-slate-900 focus:border-brand-600 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Sanction Remarks</label>
            <textarea
              rows={2}
              value={sanctionRemarks}
              onChange={(e) => setSanctionRemarks(e.target.value)}
              placeholder="e.g. Final cashless sanction issued."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:border-brand-600 focus:outline-none transition-colors"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsSanctionModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-500 transition-colors shadow-xs"
            >
              Issue Sanction
            </button>
          </div>
        </form>
      </Modal>

      {/* REJECT CLAIM MODAL */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Hospital Claim"
        subtitle="Mandatory regulatory justification required for cashless claim rejection"
      >
        <form onSubmit={handleReject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mandatory Rejection Justification * (Min 5 chars)
            </label>
            <textarea
              required
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Excluded under Policy Clause 4.2 - Cosmetic surgery without reconstructive indication."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:border-brand-600 focus:outline-none transition-colors"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-colors shadow-xs"
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </Modal>

      {/* RAISE QUERY MODAL */}
      <Modal
        isOpen={isQueryModalOpen}
        onClose={() => setIsQueryModalOpen(false)}
        title="Raise TPA Clarification Query"
        subtitle="Request missing clinical documents, histopathology, or billing justification"
      >
        <form onSubmit={handleRaiseQuery} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Query Description *</label>
            <textarea
              required
              rows={4}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="e.g. Please provide ultrasound abdomen report confirming acute calculous cholecystitis..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:border-brand-600 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">SLA Response Deadline *</label>
            <input
              type="datetime-local"
              required
              value={queryDeadline}
              onChange={(e) => setQueryDeadline(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:border-brand-600 focus:outline-none transition-colors"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsQueryModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-xs"
            >
              Dispatch Query to Hospital
            </button>
          </div>
        </form>
      </Modal>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        document={selectedDocForView}
        isOpen={!!selectedDocForView}
        onClose={() => setSelectedDocForView(null)}
      />
    </div>
  );
};
