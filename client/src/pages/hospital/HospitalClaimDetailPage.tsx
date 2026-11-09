import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { claimsApi } from '../../api/claims';
import { documentsApi } from '../../api/documents';
import { aiApi } from '../../api/ai';
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
  FileText,
  Upload,
  Cpu,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  HelpCircle,
  Eye,
  Edit3,
  User,
  Shield,
  Stethoscope,
  IndianRupee,
  RefreshCw,
  AlertCircle,
  FileCheck,
  Building2,
  ExternalLink,
  ChevronRight,
  Check,
  FileCode,
  Sparkles,
} from 'lucide-react';

export const HospitalClaimDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'documents' | 'queries' | 'audit'>('overview');
  const [selectedDocForView, setSelectedDocForView] = useState<DocumentItem | null>(null);

  // Selected document for split-screen AI review
  const [selectedAiDocId, setSelectedAiDocId] = useState<string | null>(null);

  // Document upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState('MEDICAL_BILL');
  const [isUploading, setIsUploading] = useState(false);

  // AI manual override modal state
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideField, setOverrideField] = useState<{
    extractionId: string;
    fieldName: string;
    displayName: string;
    originalValue: any;
    currentValue: any;
  } | null>(null);
  const [correctedValue, setCorrectedValue] = useState<string>('');
  const [correctionReason, setCorrectionReason] = useState<string>('');

  // Query response modal state
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  // Toast / notification state
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

  // Selected document in AI tab (default to first doc)
  const currentAiDoc = documents.find((d) => d._id === selectedAiDocId) || documents[0] || null;

  // Submit claim mutation
  const submitClaimMutation = useMutation({
    mutationFn: () => claimsApi.submitClaim(claim!._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim-details', id] });
      setToastMessage({ type: 'success', text: 'Pre-authorization request formally submitted to TPA queue!' });
    },
    onError: (err: any) => {
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit claim. Ensure mandatory fields are verified.',
      });
    },
  });

  // Run AI extraction mutation
  const runAIMutation = useMutation({
    mutationFn: (docId: string) => aiApi.runExtraction(claim!._id, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claim-details', id] });
      setToastMessage({ type: 'success', text: 'AI extraction completed. Check field-level confidence scores.' });
      setActiveTab('ai');
    },
    onError: (err: any) => {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'AI extraction failed.' });
    },
  });

  // Handle document upload
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !claim) return;
    setIsUploading(true);
    try {
      await documentsApi.uploadDocument(claim._id, uploadDocType, uploadFile);
      queryClient.invalidateQueries({ queryKey: ['claim-details', id] });
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setToastMessage({ type: 'success', text: 'Document uploaded and text parsed successfully.' });
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Upload failed.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle manual AI field override
  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideField || !correctionReason.trim()) return;

    try {
      let finalVal: any = correctedValue;
      if (overrideField.fieldName === 'claimedAmount') {
        finalVal = Number(correctedValue);
      }

      await aiApi.manualOverride(
        overrideField.extractionId,
        overrideField.fieldName,
        finalVal,
        correctionReason
      );

      queryClient.invalidateQueries({ queryKey: ['claim-details', id] });
      setIsOverrideModalOpen(false);
      setOverrideField(null);
      setCorrectedValue('');
      setCorrectionReason('');
      setToastMessage({ type: 'success', text: `Field '${overrideField.displayName}' verified and audit logged.` });
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Override failed.' });
    }
  };

  // Handle hospital query response
  const handleQueryResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueryId || !responseText.trim()) return;

    try {
      await queriesApi.respondToQuery(selectedQueryId, responseText);
      queryClient.invalidateQueries({ queryKey: ['claim-details', id] });
      setIsResponseModalOpen(false);
      setSelectedQueryId(null);
      setResponseText('');
      setToastMessage({ type: 'success', text: 'Clarification submitted. Claim returned to TPA Review.' });
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit response.' });
    }
  };

  if (isLoading) return <LoadingSkeleton rows={10} />;
  if (error || !claim) return <ErrorState message="Claim record could not be loaded." onRetry={refetch} />;

  const isDraft = claim.status === 'DRAFT';
  const hasUncertainFields = latestExtraction?.requiresManualReview;

  // Lifecycle stages definition
  const lifecycleStages = [
    { key: 'DRAFT', label: 'Draft' },
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'TPA_REVIEW', label: 'Under Review' },
    { key: 'QUERY_RAISED', label: 'Query Raised' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'SANCTIONED', label: 'Sanctioned' },
    { key: 'SETTLED', label: 'Settled' },
  ];

  const getStageStatus = (stageKey: string) => {
    const statusOrder = ['DRAFT', 'SUBMITTED', 'TPA_REVIEW', 'QUERY_RAISED', 'APPROVED', 'SANCTIONED', 'SETTLED'];
    const currentIdx = statusOrder.indexOf(claim.status);
    const stageIdx = statusOrder.indexOf(stageKey);

    if (claim.status === 'REJECTED') {
      return stageKey === 'DRAFT' ? 'completed' : 'rejected';
    }
    if (claim.status === stageKey) return 'active';
    if (stageIdx < currentIdx) return 'completed';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Hospital Workspace', path: '/hospital/claims' },
          { label: claim.claimId },
        ]}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-xs font-semibold shadow-clinical ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600 text-lg">
            ×
          </button>
        </div>
      )}

      {/* Claim Header Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-clinical flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 font-mono tracking-tight">{claim.claimId}</h1>
            <StatusBadge status={claim.status} size="lg" />
            {hasUncertainFields && isDraft && (
              <span className="inline-flex items-center space-x-1 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span>AI Review Gate Active</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Patient: <strong className="text-slate-800">{claim.patientDetails.name}</strong> ({claim.patientDetails.age}y • {claim.patientDetails.gender}) • UHID: {claim.patientDetails.patientId} • TPA:{' '}
            <strong className="text-brand-700">{claim.tpaProvider}</strong>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-clinical"
          >
            <Upload className="h-3.5 w-3.5 text-brand-600" />
            <span>Upload Document</span>
          </button>

          {isDraft && (
            <button
              onClick={() => submitClaimMutation.mutate()}
              disabled={submitClaimMutation.isPending}
              className={`flex items-center space-x-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white transition-all shadow-clinical ${
                hasUncertainFields
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-brand-600 hover:bg-brand-500'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                {submitClaimMutation.isPending ? 'Submitting...' : 'Submit Pre-Authorization'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Claim Lifecycle Pipeline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-clinical overflow-x-auto">
        <div className="flex items-center justify-between min-w-[650px] px-2">
          {lifecycleStages.map((stage, i) => {
            const status = getStageStatus(stage.key);
            const isLast = i === lifecycleStages.length - 1;

            return (
              <React.Fragment key={stage.key}>
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      status === 'completed'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : status === 'active'
                        ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-clinical'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {status === 'completed' ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className={`mt-1.5 text-[11px] font-bold tracking-tight whitespace-nowrap ${
                      status === 'active'
                        ? 'text-brand-700'
                        : status === 'completed'
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-all ${
                      status === 'completed' ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 sm:space-x-2 border-b border-slate-200 text-xs font-semibold overflow-x-auto">
        {[
          { key: 'overview', label: 'Clinical & Financial Overview', icon: FileText },
          { key: 'ai', label: 'AI Document Review', icon: Cpu },
          { key: 'documents', label: `Documents (${documents.length})`, icon: Upload },
          { key: 'queries', label: `TPA Queries (${queries.length})`, icon: HelpCircle },
          { key: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-1.5 py-3 px-3.5 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-brand-600 text-brand-700 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Patient & Admission Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-clinical space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <User className="h-4 w-4 text-brand-600" />
              <span>Patient & Admission Info</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Patient Full Name</span>
                <span className="font-bold text-slate-900">{claim.patientDetails.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Patient UHID</span>
                <span className="font-mono font-bold text-slate-900">{claim.patientDetails.patientId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Age & Gender</span>
                <span className="font-medium text-slate-800">
                  {claim.patientDetails.age} Years • {claim.patientDetails.gender}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Admission No</span>
                <span className="font-mono text-slate-800">{claim.admissionDetails.admissionNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Admission Date</span>
                <span className="font-medium text-slate-800">
                  {new Date(claim.admissionDetails.admissionDate).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Department</span>
                <span className="font-medium text-slate-800">{claim.admissionDetails.treatingDepartment}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Attending Doctor</span>
                <span className="font-medium text-slate-800">{claim.admissionDetails.doctorName}</span>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 block mb-1">Clinical Diagnosis</span>
                <p className="font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {claim.admissionDetails.diagnosis}
                </p>
              </div>
            </div>
          </div>

          {/* Insurance Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-clinical space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Shield className="h-4 w-4 text-brand-600" />
              <span>Insurance & TPA Coverage</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">TPA Provider</span>
                <span className="font-bold text-brand-700">{claim.tpaProvider}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Insurance Company</span>
                <span className="font-semibold text-slate-800">{claim.insuranceDetails.insuranceCompany}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Policy Number</span>
                <span className="font-mono font-bold text-slate-900">{claim.insuranceDetails.policyNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Policy Coverage Cap</span>
                <CurrencyFormatter amount={claim.insuranceDetails.policyCoverageLimit} className="text-slate-900 font-bold" />
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Policy Expiry</span>
                <span className="font-medium text-slate-800">
                  {new Date(claim.insuranceDetails.policyExpiryDate).toLocaleDateString('en-IN')}
                </span>
              </div>

              {financialValidation && (
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Remaining Coverage:</span>
                    <CurrencyFormatter amount={financialValidation.remainingCoverage} className="text-teal-700 font-bold" />
                  </div>
                  {financialValidation.exceedingCoverageAmount > 0 && (
                    <div className="flex justify-between text-xs text-rose-600 font-semibold">
                      <span>Exceeding Policy Limit:</span>
                      <CurrencyFormatter amount={financialValidation.exceedingCoverageAmount} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-clinical space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <IndianRupee className="h-4 w-4 text-emerald-600" />
              <span>Bill Breakdown (INR)</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Room & Nursing</span>
                <CurrencyFormatter amount={claim.financialDetails.roomCharges} />
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">OT & Procedure Charges</span>
                <CurrencyFormatter amount={claim.financialDetails.procedureCharges} />
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Medicines & Pharmacy</span>
                <CurrencyFormatter amount={claim.financialDetails.medicineCharges} />
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Diagnostic Investigations</span>
                <CurrencyFormatter amount={claim.financialDetails.investigationCharges} />
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Other Charges</span>
                <CurrencyFormatter amount={claim.financialDetails.otherCharges} />
              </div>

              <div className="flex justify-between py-2 border-t-2 border-slate-200 font-bold text-sm">
                <span>Total Claimed Amount:</span>
                <CurrencyFormatter
                  amount={claim.financialDetails.totalClaimedAmount}
                  className="text-brand-700 text-base"
                />
              </div>

              {claim.financialDetails.approvedAmount !== undefined && (
                <div className="flex justify-between py-2 border-t border-emerald-100 bg-emerald-50/50 p-2.5 rounded-xl font-bold text-xs text-emerald-800">
                  <span>Approved Pre-Auth:</span>
                  <CurrencyFormatter amount={claim.financialDetails.approvedAmount} className="text-emerald-700 text-sm font-black" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PREMIUM SPLIT-SCREEN AI DOCUMENT REVIEW */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          {/* AI Banner and Model Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-clinical">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span>AI Clinical Extraction & Human-in-the-Loop Review</span>
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 border border-brand-200 font-mono">
                    {latestExtraction?.model || 'gemini-2.5-flash'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Calibrated uncertainty threshold (0.80). Red/Amber fields require hospital staff verification before pre-auth submission.
                </p>
              </div>
            </div>

            {hasUncertainFields && (
              <span className="inline-flex items-center space-x-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 border border-amber-300">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Verification Required</span>
              </span>
            )}
          </div>

          {/* Split Screen Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT PANEL: DOCUMENT VIEWER (5 Columns) */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-clinical flex flex-col space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-brand-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Source Document Preview
                  </span>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  + Upload Document
                </button>
              </div>

              {/* Document Tabs if multiple */}
              {documents.length > 0 && (
                <div className="flex space-x-1 overflow-x-auto pb-1">
                  {documents.map((doc) => (
                    <button
                      key={doc._id}
                      onClick={() => setSelectedAiDocId(doc._id)}
                      className={`px-2.5 py-1 text-[11px] rounded-lg font-semibold truncate max-w-[150px] transition-colors ${
                        currentAiDoc?._id === doc._id
                          ? 'bg-brand-50 text-brand-700 border border-brand-200 font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {doc.originalName}
                    </button>
                  ))}
                </div>
              )}

              {currentAiDoc ? (
                <div className="space-y-3 flex-1 flex flex-col">
                  {/* File Info Bar */}
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                        {currentAiDoc.originalName}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {currentAiDoc.documentType} • {(currentAiDoc.fileSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <button
                      onClick={() => runAIMutation.mutate(currentAiDoc._id)}
                      disabled={runAIMutation.isPending}
                      className="flex items-center space-x-1 rounded-lg bg-teal-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-teal-500 transition-colors shadow-2xs"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>{runAIMutation.isPending ? 'Extracting...' : 'Re-Run AI'}</span>
                    </button>
                  </div>

                  {/* Document Content View */}
                  <div className="rounded-xl border border-slate-200 bg-slate-100 p-2 flex-1 min-h-[350px] max-h-[500px] overflow-hidden flex flex-col items-center justify-center">
                    {currentAiDoc.mimeType === 'application/pdf' ? (
                      <iframe
                        src={`/api/documents/${currentAiDoc._id}/file`}
                        className="w-full h-full min-h-[350px] rounded-lg border border-slate-200 bg-white"
                        title="Document Source PDF"
                      />
                    ) : (
                      <div className="text-center p-6 text-xs text-slate-500">
                        <FileText className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                        <p>{currentAiDoc.originalName}</p>
                      </div>
                    )}
                  </div>

                  {/* OCR Extracted Text Accordion */}
                  {currentAiDoc.extractedText && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                      <span className="font-bold text-slate-700 block mb-1">Raw Extracted Document OCR Text:</span>
                      <div className="max-h-28 overflow-y-auto font-mono text-[11px] text-slate-600 whitespace-pre-wrap bg-white p-2 rounded-lg border border-slate-200">
                        {currentAiDoc.extractedText}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-slate-400">
                  No documents uploaded yet. Upload an admission note or bill to view preview.
                </div>
              )}
            </div>

            {/* RIGHT PANEL: AI EXTRACTION RESULTS & CONFIDENCE GAUGES (7 Columns) */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-clinical space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Structured Clinical Extraction Results
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="flex items-center text-emerald-700 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></span> ≥80% High
                  </span>
                  <span className="flex items-center text-amber-700 font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span> &lt;80% Review
                  </span>
                </div>
              </div>

              {!latestExtraction ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  <Cpu className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p>No extraction record available. Click "Re-Run AI" on an uploaded document to extract fields.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Extracted Fields Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/90 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500">
                          <th className="py-2.5 px-3">Field Name</th>
                          <th className="py-2.5 px-3">Extracted Value</th>
                          <th className="py-2.5 px-3 text-center">Confidence</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { key: 'patientName', label: 'Patient Name', field: latestExtraction.extractedFields?.patientName },
                          { key: 'policyNumber', label: 'Policy Number', field: latestExtraction.extractedFields?.policyNumber },
                          { key: 'diagnosis', label: 'Clinical Diagnosis', field: latestExtraction.extractedFields?.diagnosis },
                          { key: 'claimedAmount', label: 'Claimed Value (INR)', field: latestExtraction.extractedFields?.claimedAmount },
                        ].map((item) => {
                          const isUncertain =
                            !item.field?.isVerified &&
                            (!item.field?.value || (item.field?.confidence ?? 0) < 0.80);

                          return (
                            <tr
                              key={item.key}
                              className={`transition-colors ${
                                isUncertain ? 'bg-amber-50/60 font-medium' : 'hover:bg-slate-50/50'
                              }`}
                            >
                              <td className="py-3 px-3 font-semibold text-slate-900">{item.label}</td>
                              <td className="py-3 px-3">
                                {item.field?.value !== null && item.field?.value !== undefined ? (
                                  <span className="font-bold text-slate-900">
                                    {typeof item.field.value === 'number'
                                      ? `₹${item.field.value.toLocaleString('en-IN')}`
                                      : String(item.field.value)}
                                  </span>
                                ) : (
                                  <span className="text-rose-600 font-bold italic">Missing Field</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center font-mono">
                                <span
                                  className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] ${
                                    (item.field?.confidence ?? 0) >= 0.80
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                                  }`}
                                >
                                  {((item.field?.confidence ?? 0) * 100).toFixed(0)}%
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                {item.field?.isVerified ? (
                                  <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[10px]">
                                    <Check className="h-3 w-3" />
                                    <span>Verified</span>
                                  </span>
                                ) : isUncertain ? (
                                  <span className="inline-flex items-center space-x-1 text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 text-[10px]">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>Review</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">AI Pass</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => {
                                    setOverrideField({
                                      extractionId: latestExtraction._id,
                                      fieldName: item.key,
                                      displayName: item.label,
                                      originalValue: item.field?.value ?? '',
                                      currentValue: item.field?.value ?? '',
                                    });
                                    setCorrectedValue(String(item.field?.value ?? ''));
                                    setIsOverrideModalOpen(true);
                                  }}
                                  className="inline-flex items-center space-x-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors shadow-clinical"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  <span>Verify</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Medical Coding Section (ICD-10 & CPT) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        ICD-10 Diagnostic & CPT Surgical Coding
                      </h4>
                      <button
                        onClick={() => {
                          setOverrideField({
                            extractionId: latestExtraction._id,
                            fieldName: 'primaryICD10',
                            displayName: 'Primary ICD-10 Code',
                            originalValue: '',
                            currentValue: claim.admissionDetails.primaryICD10 || '',
                          });
                          setCorrectedValue(claim.admissionDetails.primaryICD10 || '');
                          setIsOverrideModalOpen(true);
                        }}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700"
                      >
                        + Add / Override ICD-10
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {latestExtraction.extractedFields?.icdCodes?.map((codeObj, i) => (
                        <div
                          key={i}
                          className="flex items-center space-x-2 rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs"
                        >
                          <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                            {codeObj.code}
                          </span>
                          <span className="text-slate-800 font-medium">{codeObj.description}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({(codeObj.confidence * 100).toFixed(0)}%)
                          </span>
                        </div>
                      ))}
                      {(!latestExtraction.extractedFields?.icdCodes ||
                        latestExtraction.extractedFields.icdCodes.length === 0) && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 w-full flex items-center justify-between">
                          <span>No ICD-10 diagnosis codes detected. Clinical coding required.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Uploaded Clinical Documents & Invoices</h3>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center space-x-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-500 transition-colors shadow-clinical"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload New Document</span>
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-white shadow-clinical">
              <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No documents uploaded yet for this claim.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-clinical flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        {doc.documentType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold">v{doc.version}</span>
                    </div>
                    <h4 className="mt-2 text-xs font-bold text-slate-900 truncate" title={doc.originalName}>
                      {doc.originalName}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedDocForView(doc)}
                      className="flex items-center space-x-1 text-xs font-bold text-brand-600 hover:text-brand-800"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View & Inspect</span>
                    </button>

                    <button
                      onClick={() => runAIMutation.mutate(doc._id)}
                      disabled={runAIMutation.isPending}
                      className="flex items-center space-x-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Cpu className="h-3.5 w-3.5 text-teal-600" />
                      <span>Run AI</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TPA QUERIES */}
      {activeTab === 'queries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">TPA Clarification Queries</h3>
            <span className="text-xs font-semibold text-slate-500">{queries.length} Total Queries</span>
          </div>

          {queries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-white shadow-clinical">
              <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">No queries raised by TPA underwriter.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Claim processing without documentation objections.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queries.map((q) => {
                const deadlineDate = new Date(q.deadline);
                const isOverdue = deadlineDate.getTime() < Date.now();

                return (
                  <div
                    key={q._id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-clinical space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={q.status} size="sm" />
                        <span className="text-xs font-bold text-slate-900">
                          Raised by {q.raisedBy?.name || 'TPA Underwriter'}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                          isOverdue && q.status === 'OPEN'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        SLA Deadline: {deadlineDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-medium">
                      "{q.queryText}"
                    </p>

                    {q.responseText && (
                      <div className="rounded-xl bg-brand-50/60 p-3 border border-brand-200 text-xs">
                        <div className="font-bold text-brand-900 mb-1">Hospital Staff Response:</div>
                        <p className="text-brand-800">{q.responseText}</p>
                      </div>
                    )}

                    {q.status === 'OPEN' && (
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => {
                            setSelectedQueryId(q._id);
                            setIsResponseModalOpen(true);
                          }}
                          className="flex items-center space-x-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-clinical"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Submit Hospital Response</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-clinical space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Complete Audit History</h3>
              <p className="text-xs text-slate-500">Immutable chronological log of all claim and AI operations.</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              {auditLogs.length} Events
            </span>
          </div>

          <AuditTimeline logs={auditLogs} />
        </div>
      )}

      {/* MODAL 1: Upload Document Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Clinical Claim Document"
        subtitle="Attach hospital billing summaries, diagnostic reports, or prescriptions."
        maxWidth="md"
      >
        <form onSubmit={handleUploadDocument} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Document Category
            </label>
            <select
              value={uploadDocType}
              onChange={(e) => setUploadDocType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
            >
              <option value="MEDICAL_BILL">Hospital Billing Printout / Tax Invoice</option>
              <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
              <option value="ADMISSION_NOTE">Admission Note</option>
              <option value="INVESTIGATION_REPORT">Diagnostic / Pathology Report</option>
              <option value="SUPPORTING_QUERY_DOC">Supporting Document for TPA Query</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Document (PDF, PNG, JPG up to 15MB)
            </label>
            <input
              type="file"
              required
              accept=".pdf,image/png,image/jpeg"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !uploadFile}
              className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white hover:bg-brand-500 disabled:opacity-50 shadow-clinical"
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Manual AI Override Modal */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title={`Verify / Correct Field: ${overrideField?.displayName}`}
        subtitle="Manual adjustments are audited and preserved alongside original AI extraction."
        maxWidth="md"
      >
        <form onSubmit={handleSaveOverride} className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs">
            <span className="text-slate-500 block mb-0.5">Original AI Value:</span>
            <span className="font-mono font-bold text-slate-900">
              {String(overrideField?.originalValue) || 'None (Missing)'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Verified / Corrected Value <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={correctedValue}
              onChange={(e) => setCorrectedValue(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Audit Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Verified against physician admission summary page 2."
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsOverrideModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white hover:bg-brand-500 shadow-clinical"
            >
              Save Verification & Log Audit
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Query Response Modal */}
      <Modal
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        title="Submit Hospital Clarification to TPA"
        subtitle="Provide clinical documentation details or clarification requested by the underwriter."
        maxWidth="md"
      >
        <form onSubmit={handleQueryResponse} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hospital Clarification / Response Text <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe clinical findings, attached investigation results, or physician notes..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsResponseModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-clinical"
            >
              Submit Response to TPA
            </button>
          </div>
        </form>
      </Modal>

      {/* Document Inspector Modal */}
      <DocumentViewerModal
        document={selectedDocForView}
        isOpen={!!selectedDocForView}
        onClose={() => setSelectedDocForView(null)}
      />
    </div>
  );
};
