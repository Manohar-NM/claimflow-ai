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
  Trash2,
  Edit3,
  User,
  Shield,
  Stethoscope,
  IndianRupee,
  RefreshCw,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export const HospitalClaimDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'ai' | 'queries' | 'audit'>('overview');
  const [selectedDocForView, setSelectedDocForView] = useState<DocumentItem | null>(null);

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
          className={`flex items-center justify-between p-4 rounded-xl border text-xs font-semibold ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600 text-base">
            ×
          </button>
        </div>
      )}

      {/* Claim Header Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 font-mono tracking-tight">{claim.claimId}</h1>
            <StatusBadge status={claim.status} size="lg" />
            {hasUncertainFields && isDraft && (
              <span className="inline-flex items-center space-x-1 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span>AI Review Gate Active</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Patient: <strong className="text-slate-800">{claim.patientDetails.name}</strong> • UHID: {claim.patientDetails.patientId} • TPA:{' '}
            <strong className="text-slate-800">{claim.tpaProvider}</strong>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Upload className="h-3.5 w-3.5 text-brand-600" />
            <span>Upload Document</span>
          </button>

          {isDraft && (
            <button
              onClick={() => submitClaimMutation.mutate()}
              disabled={submitClaimMutation.isPending}
              className={`flex items-center space-x-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white transition-all shadow-sm ${
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

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-slate-200 text-xs font-semibold">
        {[
          { key: 'overview', label: 'Clinical & Financial Overview', icon: FileText },
          { key: 'documents', label: `Documents (${documents.length})`, icon: Upload },
          { key: 'ai', label: 'AI Extraction & Confidence', icon: Cpu },
          { key: 'queries', label: `TPA Queries (${queries.length})`, icon: HelpCircle },
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
                  ? 'border-brand-600 text-brand-700 font-bold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Patient & Admission Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <User className="h-3.5 w-3.5 text-brand-600" />
              <span>Patient & Admission Info</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Full Name</span>
                <span className="font-bold text-slate-900">{claim.patientDetails.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Age / Gender</span>
                <span className="font-semibold text-slate-800">
                  {claim.patientDetails.age} yrs • {claim.patientDetails.gender}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Hospital Patient ID</span>
                <span className="font-mono text-slate-800">{claim.patientDetails.patientId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Contact Number</span>
                <span className="font-mono text-slate-800">{claim.patientDetails.contactNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Admission No / Date</span>
                <span className="font-semibold text-slate-800">
                  {claim.admissionDetails.admissionNumber} ({new Date(claim.admissionDetails.admissionDate).toLocaleDateString()})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Department / Doctor</span>
                <span className="font-semibold text-slate-800">
                  {claim.admissionDetails.treatingDepartment} • {claim.admissionDetails.doctorName}
                </span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 block mb-1">Clinical Diagnosis:</span>
                <p className="text-xs font-medium text-slate-900 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {claim.admissionDetails.diagnosis}
                </p>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Primary ICD-10 Code</span>
                <span className="font-mono font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded border border-brand-200">
                  {claim.admissionDetails.primaryICD10 || 'Not Coded'}
                </span>
              </div>
            </div>
          </div>

          {/* Insurance & TPA Parameters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Shield className="h-3.5 w-3.5 text-brand-600" />
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
                <CurrencyFormatter amount={claim.insuranceDetails.policyCoverageLimit} className="text-slate-900" />
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Policy Expiry</span>
                <span className="font-medium text-slate-800">
                  {new Date(claim.insuranceDetails.policyExpiryDate).toLocaleDateString()}
                </span>
              </div>

              {financialValidation && (
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Remaining Coverage:</span>
                    <CurrencyFormatter amount={financialValidation.remainingCoverage} className="text-teal-700" />
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
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
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
                <div className="flex justify-between py-2 border-t border-emerald-100 bg-emerald-50/50 p-2 rounded-lg font-bold text-xs text-emerald-800">
                  <span>Approved Pre-Auth:</span>
                  <CurrencyFormatter amount={claim.financialDetails.approvedAmount} className="text-emerald-700 text-sm" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Uploaded Clinical Documents & Bills</h3>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center space-x-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-500 transition-colors shadow-2xs"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload New Document</span>
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-white">
              <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No documents uploaded yet for this claim.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        {doc.documentType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400">v{doc.version}</span>
                    </div>
                    <h4 className="mt-2 text-xs font-bold text-slate-900 truncate" title={doc.originalName}>
                      {doc.originalName}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedDocForView(doc)}
                      className="flex items-center space-x-1 text-xs font-semibold text-brand-600 hover:text-brand-800"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Inspect & Text</span>
                    </button>

                    <button
                      onClick={() => runAIMutation.mutate(doc._id)}
                      disabled={runAIMutation.isPending}
                      className="flex items-center space-x-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Cpu className="h-3.5 w-3.5 text-teal-600" />
                      <span>Run AI Extraction</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AI EXTRACTION & UNCERTAINTY HANDLING */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Cpu className="h-5 w-5 text-teal-600" />
                  <span>AI Structured Document Extraction</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calibrated field-level uncertainty scoring (Threshold: 0.80). Uncertain fields require human review.
                </p>
              </div>

              {latestExtraction && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">Model:</span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700">
                    {latestExtraction.model}
                  </span>
                </div>
              )}
            </div>

            {!latestExtraction ? (
              <div className="text-center py-12">
                <Cpu className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  No AI document extraction has been executed yet. Select a document from the Documents tab to run analysis.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Uncertainty Banner */}
                {latestExtraction.requiresManualReview ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs">
                    <div className="flex items-center space-x-2 font-bold text-amber-900 mb-1">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span>Uncertain Extracted Fields Detected — Human Review Gate Active</span>
                    </div>
                    <p className="text-amber-800">
                      The extraction engine detected fields with confidence below 0.80 or missing mandatory clinical
                      codes. Please verify and manually correct uncertain fields before submitting pre-authorization.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs flex items-center space-x-2 text-emerald-800 font-semibold">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>All mandatory fields verified. Confidence exceeds enterprise compliance threshold.</span>
                  </div>
                )}

                {/* Field-by-Field Extraction Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-2.5 px-3">Field Name</th>
                        <th className="py-2.5 px-3">Extracted Value</th>
                        <th className="py-2.5 px-3 text-center">Confidence</th>
                        <th className="py-2.5 px-3">Source Evidence</th>
                        <th className="py-2.5 px-3 text-center">Verification Status</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { key: 'patientName', label: 'Patient Name', field: latestExtraction.extractedFields?.patientName },
                        { key: 'policyNumber', label: 'Policy Number', field: latestExtraction.extractedFields?.policyNumber },
                        { key: 'diagnosis', label: 'Clinical Diagnosis', field: latestExtraction.extractedFields?.diagnosis },
                        { key: 'claimedAmount', label: 'Claimed Amount (INR)', field: latestExtraction.extractedFields?.claimedAmount },
                      ].map((item) => {
                        const isUncertain =
                          !item.field?.isVerified &&
                          (!item.field?.value || (item.field?.confidence ?? 0) < 0.80);

                        return (
                          <tr
                            key={item.key}
                            className={`transition-colors ${
                              isUncertain ? 'bg-amber-50/80 font-medium' : 'hover:bg-slate-50/50'
                            }`}
                          >
                            <td className="py-3 px-3 font-semibold text-slate-800">{item.label}</td>
                            <td className="py-3 px-3">
                              {item.field?.value !== null && item.field?.value !== undefined ? (
                                <span className="font-semibold text-slate-900">
                                  {typeof item.field.value === 'number'
                                    ? `₹${item.field.value.toLocaleString('en-IN')}`
                                    : String(item.field.value)}
                                </span>
                              ) : (
                                <span className="text-rose-500 italic">Missing Value</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                                  (item.field?.confidence ?? 0) >= 0.80
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-200 text-amber-900 animate-pulse'
                                }`}
                              >
                                {((item.field?.confidence ?? 0) * 100).toFixed(0)}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-500 italic max-w-xs truncate" title={item.field?.sourceEvidence}>
                              {item.field?.sourceEvidence || '—'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {item.field?.isVerified ? (
                                <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                                  <FileCheck className="h-3 w-3" />
                                  <span>Human Verified</span>
                                </span>
                              ) : isUncertain ? (
                                <span className="inline-flex items-center space-x-1 text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded border border-amber-300 text-[11px]">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Review Required</span>
                                </span>
                              ) : (
                                <span className="text-slate-400">AI Passed</span>
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
                                className="inline-flex items-center space-x-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors shadow-2xs"
                              >
                                <Edit3 className="h-3 w-3" />
                                <span>Correct / Verify</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ICD-10 Codes Section */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Extracted ICD-10 Diagnosis Codes
                  </h4>
                  {(!latestExtraction.extractedFields?.icdCodes ||
                    latestExtraction.extractedFields.icdCodes.length === 0) ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                      <span>No ICD-10 codes found. Mandatory clinical coding required.</span>
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
                        className="rounded-lg bg-amber-600 px-2.5 py-1 text-white font-bold text-xs"
                      >
                        Add ICD-10 Code
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {latestExtraction.extractedFields.icdCodes.map((codeObj, i) => (
                        <div
                          key={i}
                          className="flex items-center space-x-2 rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs"
                        >
                          <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                            {codeObj.code}
                          </span>
                          <span className="text-slate-800">{codeObj.description}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({(codeObj.confidence * 100).toFixed(0)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: TPA QUERIES */}
      {activeTab === 'queries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">TPA Clarification Queries</h3>
          </div>

          {queries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-white">
              <HelpCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No formal queries raised by TPA for this claim.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queries.map((q) => {
                const isOpen = q.status === 'OPEN' || q.status === 'REOPENED';
                const deadlineDate = new Date(q.deadline);

                return (
                  <div
                    key={q._id}
                    className={`rounded-2xl border p-5 shadow-sm space-y-3 ${
                      isOpen ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={q.status} size="sm" />
                        <span className="text-xs text-slate-500">
                          Raised by: <strong>{q.raisedBy?.name || 'TPA Underwriter'}</strong>
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        Deadline: {deadlineDate.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>

                    <div className="rounded-xl bg-white p-3.5 border border-slate-200 text-xs text-slate-900 font-medium">
                      "{q.queryText}"
                    </div>

                    {q.responseText && (
                      <div className="rounded-xl bg-brand-50/60 p-3.5 border border-brand-200 text-xs">
                        <span className="font-bold text-brand-800 block mb-1">Hospital Response:</span>
                        <p className="text-slate-800">{q.responseText}</p>
                      </div>
                    )}

                    {isOpen && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => {
                            setSelectedQueryId(q._id);
                            setIsResponseModalOpen(true);
                          }}
                          className="flex items-center space-x-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-2xs"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Submit Hospital Clarification</span>
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Immutable Regulatory Audit Trail</h3>
          <AuditTimeline logs={auditLogs} />
        </div>
      )}

      {/* Document Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Hospital Clinical Document"
        subtitle="Attach bills, admission notes, or discharge records for AI parsing"
      >
        <form onSubmit={handleUploadDocument} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Document Category</label>
            <select
              value={uploadDocType}
              onChange={(e) => setUploadDocType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
            >
              <option value="MEDICAL_BILL">Hospital Billing Printout / Tax Invoice</option>
              <option value="ADMISSION_NOTE">Hospital Admission Note</option>
              <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
              <option value="INVESTIGATION_REPORT">Diagnostic / Lab Report</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select File</label>
            <input
              type="file"
              required
              accept=".pdf,image/png,image/jpeg"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !uploadFile}
              className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {isUploading ? 'Uploading & Parsing...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual AI Override Modal */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title={`Manual Correction: ${overrideField?.displayName}`}
        subtitle="Human verification for uncertain AI fields with mandatory regulatory audit reasoning"
      >
        <form onSubmit={handleSaveOverride} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 block mb-0.5">Original AI Value:</span>
            <span className="font-mono font-bold text-slate-800">
              {overrideField?.originalValue !== '' ? String(overrideField?.originalValue) : 'None / Missing'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Corrected Value *</label>
            <input
              type="text"
              required
              value={correctedValue}
              onChange={(e) => setCorrectedValue(e.target.value)}
              placeholder="Enter verified value"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Correction Justification / Reason * (Mandatory for audit trail)
            </label>
            <textarea
              required
              rows={3}
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="e.g. Verified with attending physician Dr. Sen against physical discharge record."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsOverrideModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
            >
              Confirm & Save Verification
            </button>
          </div>
        </form>
      </Modal>

      {/* Query Response Modal */}
      <Modal
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        title="Submit Response to TPA Query"
        subtitle="Clarify medical documentation or procedural questions to restore claim review"
      >
        <form onSubmit={handleQueryResponse} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Clarification Response *</label>
            <textarea
              required
              rows={4}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Enter comprehensive clinical or billing explanation..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsResponseModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
            >
              Submit Response to TPA
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
