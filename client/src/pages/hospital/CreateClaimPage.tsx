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
  Activity,
  IndianRupee,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  FileText,
  Save,
  Building2,
  FileCheck,
} from 'lucide-react';

export const CreateClaimPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('ADMISSION_NOTE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
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
        dischargeDate: '',
        diagnosis: '',
        primaryICD10: '',
        secondaryICD10: '',
        cptCodes: '',
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

  const formData = watch();
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
    { number: 4, title: 'Diagnosis & Codes', icon: Activity },
    { number: 5, title: 'Billing Breakdown', icon: IndianRupee },
    { number: 6, title: 'Document & Review', icon: UploadCloud },
  ];

  const handleNextStep = async () => {
    let isValid = true;
    if (currentStep === 1) {
      isValid = await trigger(['patientDetails.name', 'patientDetails.patientId', 'patientDetails.age', 'patientDetails.contactNumber']);
    } else if (currentStep === 2) {
      isValid = await trigger(['insuranceDetails.policyNumber', 'insuranceDetails.insuranceCompany', 'insuranceDetails.policyCoverageLimit']);
    } else if (currentStep === 3) {
      isValid = await trigger(['admissionDetails.admissionNumber', 'admissionDetails.admissionDate', 'admissionDetails.treatingDepartment', 'admissionDetails.doctorName']);
    } else if (currentStep === 4) {
      isValid = await trigger(['admissionDetails.diagnosis']);
    } else if (currentStep === 5) {
      isValid = await trigger(['financialDetails.totalClaimedAmount']);
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const onSubmitDraft = async (data: any) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        ...data,
        patientDetails: {
          ...data.patientDetails,
          age: Number(data.patientDetails.age),
        },
        insuranceDetails: {
          ...data.insuranceDetails,
          policyCoverageLimit: Number(data.insuranceDetails.policyCoverageLimit),
          policyExpiryDate: new Date(data.insuranceDetails.policyExpiryDate),
        },
        admissionDetails: {
          ...data.admissionDetails,
          admissionDate: new Date(data.admissionDetails.admissionDate),
          dischargeDate: data.admissionDetails.dischargeDate ? new Date(data.admissionDetails.dischargeDate) : undefined,
          secondaryICD10: data.admissionDetails.secondaryICD10
            ? data.admissionDetails.secondaryICD10.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
          cptCodes: data.admissionDetails.cptCodes
            ? data.admissionDetails.cptCodes.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
        },
        financialDetails: {
          estimatedCost: Number(data.financialDetails.totalClaimedAmount),
          roomCharges: Number(data.financialDetails.roomCharges || 0),
          procedureCharges: Number(data.financialDetails.procedureCharges || 0),
          medicineCharges: Number(data.financialDetails.medicineCharges || 0),
          investigationCharges: Number(data.financialDetails.investigationCharges || 0),
          otherCharges: Number(data.financialDetails.otherCharges || 0),
          totalClaimedAmount: Number(data.financialDetails.totalClaimedAmount),
          currency: 'INR',
        },
        tpaProvider: data.insuranceDetails.tpaProvider || 'Star Health',
      };

      const res = await claimsApi.createClaim(payload);
      const newClaim = res.data;

      // Upload document if attached
      if (selectedFile && newClaim?._id) {
        try {
          await documentsApi.uploadDocument(newClaim._id, documentType, selectedFile);
        } catch (uploadErr) {
          console.warn('Initial doc upload warning:', uploadErr);
        }
      }

      navigate(`/hospital/claims/${newClaim._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create claim draft. Please check required fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Hospital Workspace', path: '/hospital/dashboard' },
          { label: 'Claims', path: '/hospital/claims' },
          { label: 'New Cashless Claim' },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-clinical">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Create Cashless Insurance Claim
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Initiate a structured cashless pre-authorization request for TPA adjudication.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <Building2 className="h-4 w-4 text-brand-600" />
          <span>City Care Multispecialty Hospital</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2.5 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800 shadow-clinical">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Progress Tracker */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {steps.map((s) => {
          const isActive = s.number === currentStep;
          const isDone = s.number < currentStep;

          return (
            <div
              key={s.number}
              onClick={() => s.number < currentStep && setCurrentStep(s.number)}
              className={`flex items-center space-x-2 p-2.5 sm:p-3 rounded-xl border transition-all ${
                isActive
                  ? 'border-brand-500 bg-brand-50/70 text-brand-700 font-bold shadow-clinical'
                  : isDone
                  ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800 cursor-pointer font-semibold'
                  : 'border-slate-200 bg-white text-slate-400 font-medium'
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.number}
              </div>
              <span className="text-[11px] truncate hidden sm:inline">{s.title}</span>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmitDraft)}>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-clinical">
          {/* STEP 1: PATIENT INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <User className="h-5 w-5 text-brand-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Step 1: Patient Demographic & Hospital Identification
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Patient Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('patientDetails.name', { required: 'Patient name is mandatory' })}
                    placeholder="e.g. Ramesh Sundaram"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                  {errors.patientDetails?.name && (
                    <p className="mt-1 text-[11px] text-rose-600">{errors.patientDetails.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hospital Patient UHID / Reg ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('patientDetails.patientId', { required: 'Patient ID is required' })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-mono text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Patient Age <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register('patientDetails.age', { required: true, min: 0, max: 130 })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register('patientDetails.gender')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-semibold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('patientDetails.contactNumber', { required: 'Contact phone required' })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: INSURANCE INFORMATION */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <Shield className="h-5 w-5 text-brand-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Step 2: Insurance Provider & TPA Policy Parameters
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    TPA Provider <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register('insuranceDetails.tpaProvider')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-semibold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
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
                    Insurance Underwriter Company <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('insuranceDetails.insuranceCompany', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Insurance Policy Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. STAR-FLOATER-99281"
                    {...register('insuranceDetails.policyNumber', { required: 'Policy number is mandatory' })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-mono font-bold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Policy Coverage Cap (₹ INR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register('insuranceDetails.policyCoverageLimit', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Policy Validity Expiry Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('insuranceDetails.policyExpiryDate', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ADMISSION DETAILS */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <Stethoscope className="h-5 w-5 text-brand-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Step 3: Hospital Admission & Ward Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hospital Admission Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('admissionDetails.admissionNumber', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-mono text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admission Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('admissionDetails.admissionDate', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Discharge Date (Optional)
                  </label>
                  <input
                    type="date"
                    {...register('admissionDetails.dischargeDate')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Treating Department <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cardiology, Orthopedics"
                    {...register('admissionDetails.treatingDepartment', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Attending Physician / Surgeon <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Vikram Malhotra, DM Cardiology"
                    {...register('admissionDetails.doctorName', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DIAGNOSIS & CLINICAL CODES */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <Activity className="h-5 w-5 text-teal-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Step 4: Clinical Diagnosis & Medical Coding
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Clinical Diagnosis <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acute ST-Elevation Myocardial Infarction (STEMI), CAD"
                    {...register('admissionDetails.diagnosis', { required: 'Diagnosis is mandatory' })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary ICD-10 Code (e.g. I21.0)
                  </label>
                  <input
                    type="text"
                    placeholder="Optional now (AI can extract from documents)"
                    {...register('admissionDetails.primaryICD10')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-mono text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Secondary ICD-10 Codes (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. I25.10, E11.9"
                    {...register('admissionDetails.secondaryICD10')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-mono text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CPT / Procedure Codes (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 92928, 93458"
                    {...register('admissionDetails.cptCodes')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-mono text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: BILLING INFORMATION */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <IndianRupee className="h-5 w-5 text-emerald-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Step 5: Hospital Billing Breakdown (INR)
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Room & Nursing Charges (₹)
                  </label>
                  <input
                    type="number"
                    {...register('financialDetails.roomCharges', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    OT / Surgical Procedure Charges (₹)
                  </label>
                  <input
                    type="number"
                    {...register('financialDetails.procedureCharges', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pharmacy & Medicines (₹)
                  </label>
                  <input
                    type="number"
                    {...register('financialDetails.medicineCharges', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Diagnostic & Lab Investigations (₹)
                  </label>
                  <input
                    type="number"
                    {...register('financialDetails.investigationCharges', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Other Incidental Charges (₹)
                  </label>
                  <input
                    type="number"
                    {...register('financialDetails.otherCharges', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Pre-Auth Claimed Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register('financialDetails.totalClaimedAmount', { required: true })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-bold text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Real-time sum calculation validation notice */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-600">Calculated Itemized Sum: </span>
                  <CurrencyFormatter amount={calculatedTotal} className="text-slate-900 font-bold ml-1" />
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Total Claimed: </span>
                  <CurrencyFormatter
                    amount={Number(watchFinancials.totalClaimedAmount || 0)}
                    className="text-brand-700 font-extrabold ml-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: DOCUMENT UPLOAD & FINAL REVIEW */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <UploadCloud className="h-5 w-5 text-brand-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Step 6: Clinical Document Upload & Final Review
                </h2>
              </div>

              {/* Document upload box */}
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-800">Attach Initial Medical Document for AI Extraction</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Document Type</label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                    >
                      <option value="ADMISSION_NOTE">Hospital Admission Note</option>
                      <option value="MEDICAL_BILL">Hospital Billing Printout / Bill</option>
                      <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                      <option value="INVESTIGATION_REPORT">Diagnostic / Pathology Report</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select File (PDF, PNG, JPG)</label>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                    />
                  </div>
                </div>

                {selectedFile && (
                  <div className="flex items-center space-x-2 p-2.5 bg-brand-50 rounded-xl border border-brand-200 text-xs text-brand-800">
                    <FileText className="h-4 w-4 text-brand-600 shrink-0" />
                    <span className="font-semibold">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              {/* Final Review Summary Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                  <span>Pre-Submission Review Summary</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Patient Information</div>
                    <div className="font-bold text-slate-900">{formData.patientDetails?.name || '—'}</div>
                    <div className="text-slate-500">{formData.patientDetails?.age} yrs • {formData.patientDetails?.gender} • ID: {formData.patientDetails?.patientId}</div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">TPA & Insurance</div>
                    <div className="font-bold text-brand-700">{formData.insuranceDetails?.tpaProvider}</div>
                    <div className="text-slate-500">Policy: <span className="font-mono font-semibold">{formData.insuranceDetails?.policyNumber || '—'}</span></div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Clinical Diagnosis</div>
                    <div className="font-bold text-slate-900">{formData.admissionDetails?.diagnosis || '—'}</div>
                    <div className="text-slate-500">{formData.admissionDetails?.treatingDepartment} • {formData.admissionDetails?.doctorName}</div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Estimated Pre-Auth Cost</div>
                    <div className="font-black text-slate-900 text-sm">
                      <CurrencyFormatter amount={Number(formData.financialDetails?.totalClaimedAmount || 0)} />
                    </div>
                    <div className="text-slate-500">Itemized sum: ₹{calculatedTotal.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step Navigation Controls */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous Step</span>
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center space-x-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-500 transition-colors shadow-clinical"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-clinical disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Saving Claim Draft...</span>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
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
