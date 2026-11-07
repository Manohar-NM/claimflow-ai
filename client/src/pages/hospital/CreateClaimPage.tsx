import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { claimsApi } from '../../api/claims';
import { documentsApi } from '../../api/documents';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { CurrencyFormatter } from '../../components/common/CurrencyFormatter';
import {
  User,
  Shield,
  Stethoscope,
  IndianRupee,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const CreateClaimPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [createdClaimId, setCreatedClaimId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('ADMISSION_NOTE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      patientDetails: {
        name: '',
        age: 45,
        gender: 'MALE',
        patientId: `PT-${Math.floor(10000 + Math.random() * 90000)}`,
        contactNumber: '',
      },
      insuranceDetails: {
        insuranceCompany: 'Star Health and Allied Insurance',
        tpaProvider: 'Star Health',
        policyNumber: '',
        policyCoverageLimit: 500000,
        policyExpiryDate: '2026-12-31',
      },
      admissionDetails: {
        admissionNumber: `ADM-2026-${Math.floor(100 + Math.random() * 900)}`,
        admissionDate: new Date().toISOString().split('T')[0],
        diagnosis: '',
        primaryICD10: '',
        treatingDepartment: 'General Surgery',
        doctorName: 'Dr. Vivek Joshi, MS',
      },
      financialDetails: {
        estimatedCost: 120000,
        roomCharges: 20000,
        procedureCharges: 65000,
        medicineCharges: 20000,
        investigationCharges: 10000,
        otherCharges: 5000,
        totalClaimedAmount: 120000,
      },
      tpaProvider: 'Star Health',
    },
  });

  const watchFinancials = watch('financialDetails');
  const calculatedTotal =
    Number(watchFinancials.roomCharges || 0) +
    Number(watchFinancials.procedureCharges || 0) +
    Number(watchFinancials.medicineCharges || 0) +
    Number(watchFinancials.investigationCharges || 0) +
    Number(watchFinancials.otherCharges || 0);

  const steps = [
    { number: 1, title: 'Patient Info', icon: User },
    { number: 2, title: 'Insurance & TPA', icon: Shield },
    { number: 3, title: 'Admission Details', icon: Stethoscope },
    { number: 4, title: 'Financial Breakdown', icon: IndianRupee },
    { number: 5, title: 'Clinical Documents', icon: UploadCloud },
  ];

  const onSubmitDraft = async (formData: any) => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Ensure numeric types
      const payload = {
        ...formData,
        patientDetails: {
          ...formData.patientDetails,
          age: Number(formData.patientDetails.age),
        },
        insuranceDetails: {
          ...formData.insuranceDetails,
          policyCoverageLimit: Number(formData.insuranceDetails.policyCoverageLimit),
        },
        financialDetails: {
          estimatedCost: Number(formData.financialDetails.estimatedCost),
          roomCharges: Number(formData.financialDetails.roomCharges),
          procedureCharges: Number(formData.financialDetails.procedureCharges),
          medicineCharges: Number(formData.financialDetails.medicineCharges),
          investigationCharges: Number(formData.financialDetails.investigationCharges),
          otherCharges: Number(formData.financialDetails.otherCharges),
          totalClaimedAmount: Number(formData.financialDetails.totalClaimedAmount),
          currency: 'INR',
        },
        tpaProvider: formData.insuranceDetails.tpaProvider,
      };

      const res = await claimsApi.createClaim(payload);
      const claim = res.data;
      setCreatedClaimId(claim._id);

      // If a document was selected in Step 5, upload it immediately
      if (selectedFile) {
        await documentsApi.uploadDocument(claim._id, documentType, selectedFile);
      }

      navigate(`/hospital/claims/${claim._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create claim record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Hospital Workspace', path: '/hospital/claims' },
          { label: 'Create New Claim' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Cashless Pre-Authorization Claim
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Step-by-step multi-part hospital admission, clinical coding and insurance registration.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stepper Progress Indicator */}
      <div className="grid grid-cols-5 gap-2">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.number;
          const isDone = currentStep > s.number;

          return (
            <div
              key={s.number}
              onClick={() => s.number < currentStep && setCurrentStep(s.number)}
              className={`flex items-center space-x-2 p-3 rounded-xl border transition-all ${
                isActive
                  ? 'border-brand-500 bg-brand-50/60 text-brand-700 font-bold shadow-2xs'
                  : isDone
                  ? 'border-emerald-200 bg-emerald-50/40 text-emerald-800 cursor-pointer font-medium'
                  : 'border-slate-200 bg-white text-slate-400 font-medium'
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : s.number}
              </div>
              <span className="hidden sm:inline text-xs truncate">{s.title}</span>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmitDraft)}>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* STEP 1: PATIENT INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                <User className="h-4 w-4 text-brand-600" />
                <span>Step 1: Patient Demographic & Hospital Identification</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    {...register('patientDetails.name', { required: 'Patient name is mandatory' })}
                    placeholder="e.g. Ramesh Sundaram"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                  {errors.patientDetails?.name && (
                    <p className="mt-1 text-xs text-rose-600">{errors.patientDetails.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hospital Patient ID / UHID *
                  </label>
                  <input
                    type="text"
                    {...register('patientDetails.patientId', { required: 'Patient ID is required' })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-mono text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age *</label>
                  <input
                    type="number"
                    {...register('patientDetails.age', { required: true, min: 0, max: 130 })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    {...register('patientDetails.gender')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    {...register('patientDetails.contactNumber', { required: 'Contact phone required' })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: INSURANCE INFORMATION */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                <Shield className="h-4 w-4 text-brand-600" />
                <span>Step 2: Insurance Provider & TPA Policy Parameters</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    TPA Provider *
                  </label>
                  <select
                    {...register('insuranceDetails.tpaProvider')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-semibold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  >
                    <option value="Star Health">Star Health</option>
                    <option value="Medi Assist">Medi Assist</option>
                    <option value="Niva Bupa">Niva Bupa</option>
                    <option value="HDFC ERGO">HDFC ERGO</option>
                    <option value="ICICI Lombard">ICICI Lombard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Insurance Underwriter Company *
                  </label>
                  <input
                    type="text"
                    {...register('insuranceDetails.insuranceCompany', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Insurance Policy Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. STAR-FLOATER-99281"
                    {...register('insuranceDetails.policyNumber', { required: 'Policy number is mandatory' })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-mono text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Policy Coverage Limit (₹ INR) *
                  </label>
                  <input
                    type="number"
                    {...register('insuranceDetails.policyCoverageLimit', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Policy Validity Expiry Date *
                  </label>
                  <input
                    type="date"
                    {...register('insuranceDetails.policyExpiryDate', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ADMISSION DETAILS */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                <Stethoscope className="h-4 w-4 text-brand-600" />
                <span>Step 3: Clinical Admission & ICD-10 Coding</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hospital Admission Number *
                  </label>
                  <input
                    type="text"
                    {...register('admissionDetails.admissionNumber', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-mono text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admission Date *
                  </label>
                  <input
                    type="date"
                    {...register('admissionDetails.admissionDate', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Clinical Diagnosis *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acute Calculus Cholecystitis with Choledocholithiasis"
                    {...register('admissionDetails.diagnosis', { required: 'Diagnosis is required' })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary ICD-10 Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. K80.00 (Optional now, will be auto-extracted by AI)"
                    {...register('admissionDetails.primaryICD10')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-mono text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Treating Medical Department *
                  </label>
                  <input
                    type="text"
                    {...register('admissionDetails.treatingDepartment', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Attending Physician / Surgeon *
                  </label>
                  <input
                    type="text"
                    {...register('admissionDetails.doctorName', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: FINANCIAL BREAKDOWN */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                <IndianRupee className="h-4 w-4 text-brand-600" />
                <span>Step 4: Itemized Hospital Bill Components & Estimated Cost</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Room & Nursing Charges (₹)
                  </label>
                  <input
                    type="number"
                    {...register('financialDetails.roomCharges', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    OT / Surgical Procedure Charges (₹)
                  </label>
                  <input
                    type="number"
                    {...register('financialDetails.procedureCharges', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pharmacy & Medicines (₹)
                  </label>
                  <input
                    type="number"
                    {...register('financialDetails.medicineCharges', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Investigations / Diagnostics (₹)
                  </label>
                  <input
                    type="number"
                    {...register('financialDetails.investigationCharges', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Other Incidental Charges (₹)
                  </label>
                  <input
                    type="number"
                    {...register('financialDetails.otherCharges', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Claimed Pre-Auth Amount (₹) *
                  </label>
                  <input
                    type="number"
                    {...register('financialDetails.totalClaimedAmount', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-bold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Real-time sum calculation validation notice */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-700">Calculated Itemized Total: </span>
                  <CurrencyFormatter amount={calculatedTotal} className="text-slate-900 ml-1" />
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Claimed Amount: </span>
                  <CurrencyFormatter
                    amount={Number(watchFinancials.totalClaimedAmount || 0)}
                    className="text-brand-700 ml-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: DOCUMENT UPLOAD */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                <UploadCloud className="h-4 w-4 text-brand-600" />
                <span>Step 5: Upload Medical Documents for AI Extraction</span>
              </h2>

              <p className="text-xs text-slate-500">
                Attach admission notes, medical bills, or discharge summaries. The ClaimFlow AI engine
                will parse clinical text and extract ICD-10/CPT codes.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Document Category
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  >
                    <option value="ADMISSION_NOTE">Hospital Admission Note</option>
                    <option value="MEDICAL_BILL">Hospital Billing Printout / Invoice</option>
                    <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                    <option value="INVESTIGATION_REPORT">Diagnostic / Pathology Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select File (PDF, PNG, JPEG up to 15MB)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                  />
                </div>
              </div>

              {selectedFile && (
                <div className="flex items-center space-x-2 p-3 bg-brand-50/60 rounded-xl border border-brand-200 text-xs text-brand-800">
                  <FileText className="h-4 w-4 text-brand-600" />
                  <span>
                    Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous Step</span>
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="flex items-center space-x-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-500 transition-colors shadow-sm"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Saving Claim Draft...</span>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Save Draft & Open Workspace</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
