import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { Types } from 'mongoose';
import { connectDB, disconnectDB } from '../config/database.js';
import { User } from '../models/User.js';
import { Claim } from '../models/Claim.js';
import { Document } from '../models/Document.js';
import { AIExtraction } from '../models/AIExtraction.js';
import { TPAQuery } from '../models/TPAQuery.js';
import { AuditLog } from '../models/AuditLog.js';
import { config } from '../config/index.js';

export const runSeed = async (shouldDisconnect = false) => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    // Ensure uploads directory exists and sample dummy files exist
    if (!fs.existsSync(config.uploadDir)) {
      fs.mkdirSync(config.uploadDir, { recursive: true });
    }

    const sampleDocPath = path.join(config.uploadDir, 'demo-admission-summary.pdf');
    if (!fs.existsSync(sampleDocPath)) {
      fs.writeFileSync(
        sampleDocPath,
        '%PDF-1.4\n1 0 obj\n<< /Title (Demo Discharge Summary) /Author (City Care Hospital) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'
      );
    }

    console.log('[Seed] Checking demo users (idempotent)...');
    const salt = await bcrypt.genSalt(10);
    const hospitalPasswordHash = await bcrypt.hash('HospitalStaff@2026!', salt);
    const tpaPasswordHash = await bcrypt.hash('TPAManager@2026!', salt);

    let hospitalUser = await User.findOne({ email: 'hospital@claimflow.demo' });
    if (!hospitalUser) {
      hospitalUser = await User.create({
        name: 'Dr. Priya Sharma (Billing Lead)',
        email: 'hospital@claimflow.demo',
        passwordHash: hospitalPasswordHash,
        role: 'HOSPITAL_STAFF',
        organization: 'City Care Multispecialty Hospital',
        isActive: true,
      });
      console.log(`[Seed] Created hospital user: ${hospitalUser.email}`);
    } else {
      console.log(`[Seed] Hospital user already exists: ${hospitalUser.email}`);
    }

    let tpaUser = await User.findOne({ email: 'tpa@claimflow.demo' });
    if (!tpaUser) {
      tpaUser = await User.create({
        name: 'Rajesh Verma (Senior Adjudicator)',
        email: 'tpa@claimflow.demo',
        passwordHash: tpaPasswordHash,
        role: 'TPA_MANAGER',
        organization: 'HealthGuard TPA Services',
        isActive: true,
      });
      console.log(`[Seed] Created TPA user: ${tpaUser.email}`);
    } else {
      console.log(`[Seed] TPA user already exists: ${tpaUser.email}`);
    }

    console.log(`[Seed] Created users: ${hospitalUser.email}, ${tpaUser.email}`);

    // Sample claims data
    const sampleClaimsData = [
      {
        claimId: 'CF-202602-1001',
        patientDetails: {
          name: 'Ramesh Sundaram',
          age: 52,
          gender: 'MALE' as const,
          patientId: 'PT-88910',
          contactNumber: '+91 98765 43210',
        },
        insuranceDetails: {
          insuranceCompany: 'Star Health and Allied Insurance',
          tpaProvider: 'Star Health',
          policyNumber: 'STAR-FLOATER-99281',
          policyCoverageLimit: 500000,
          policyExpiryDate: new Date('2026-12-31'),
        },
        admissionDetails: {
          admissionNumber: 'ADM-2026-041',
          admissionDate: new Date('2026-02-10'),
          dischargeDate: new Date('2026-02-14'),
          diagnosis: 'Acute ST-Elevation Myocardial Infarction (STEMI), CAD',
          primaryICD10: 'I21.0',
          secondaryICD10: ['I25.10', 'E11.9'],
          cptCodes: ['92928', '93458'],
          treatingDepartment: 'Cardiology',
          doctorName: 'Dr. Vikram Malhotra, DM Cardiology',
        },
        financialDetails: {
          estimatedCost: 280000,
          roomCharges: 35000,
          procedureCharges: 165000,
          medicineCharges: 48000,
          investigationCharges: 22000,
          otherCharges: 10000,
          totalClaimedAmount: 280000,
          approvedAmount: 265000,
          sanctionedAmount: 265000,
          currency: 'INR' as const,
          remarks: 'Coronary angioplasty with single drug-eluting stent. Pre-auth sanctioned.',
        },
        tpaProvider: 'Star Health',
        status: 'SANCTIONED' as const,
        createdBy: hospitalUser._id,
        assignedTo: tpaUser._id,
        submittedAt: new Date(Date.now() - 3 * 86400000),
        approvedAt: new Date(Date.now() - 2 * 86400000),
        sanctionedAt: new Date(Date.now() - 1 * 86400000),
      },
      {
        claimId: 'CF-202602-1002',
        patientDetails: {
          name: 'Sunita Rao',
          age: 41,
          gender: 'FEMALE' as const,
          patientId: 'PT-88911',
          contactNumber: '+91 98111 22334',
        },
        insuranceDetails: {
          insuranceCompany: 'Niva Bupa Health Insurance',
          tpaProvider: 'Niva Bupa',
          policyNumber: 'NIVA-REASSURE-44120',
          policyCoverageLimit: 750000,
          policyExpiryDate: new Date('2026-11-15'),
        },
        admissionDetails: {
          admissionNumber: 'ADM-2026-042',
          admissionDate: new Date('2026-02-12'),
          diagnosis: 'Acute Calculus Cholecystitis with Choledocholithiasis',
          primaryICD10: 'K80.00',
          secondaryICD10: ['K80.50'],
          cptCodes: ['47562'],
          treatingDepartment: 'General & Laparoscopic Surgery',
          doctorName: 'Dr. Ananya Sen, MS General Surgery',
        },
        financialDetails: {
          estimatedCost: 125000,
          roomCharges: 20000,
          procedureCharges: 68000,
          medicineCharges: 19000,
          investigationCharges: 12000,
          otherCharges: 6000,
          totalClaimedAmount: 125000,
          currency: 'INR' as const,
        },
        tpaProvider: 'Niva Bupa',
        status: 'QUERY_RAISED' as const,
        createdBy: hospitalUser._id,
        assignedTo: tpaUser._id,
        submittedAt: new Date(Date.now() - 1 * 86400000),
      },
      {
        claimId: 'CF-202602-1003',
        patientDetails: {
          name: 'Anil Kumar Patel',
          age: 63,
          gender: 'MALE' as const,
          patientId: 'PT-88912',
          contactNumber: '+91 97234 56789',
        },
        insuranceDetails: {
          insuranceCompany: 'HDFC ERGO General Insurance',
          tpaProvider: 'HDFC ERGO',
          policyNumber: 'HDFC-OPTIMA-88319',
          policyCoverageLimit: 1000000,
          policyExpiryDate: new Date('2027-01-31'),
        },
        admissionDetails: {
          admissionNumber: 'ADM-2026-043',
          admissionDate: new Date('2026-02-13'),
          diagnosis: 'Severe Osteoarthritis Right Knee requiring Total Knee Arthroplasty',
          primaryICD10: 'M17.11',
          secondaryICD10: ['I10'],
          cptCodes: ['27447'],
          treatingDepartment: 'Orthopedics',
          doctorName: 'Dr. K. Srinivas, MS Ortho',
        },
        financialDetails: {
          estimatedCost: 245000,
          roomCharges: 30000,
          procedureCharges: 145000,
          medicineCharges: 38000,
          investigationCharges: 18000,
          otherCharges: 14000,
          totalClaimedAmount: 245000,
          approvedAmount: 235000,
          currency: 'INR' as const,
          remarks: 'Approved for unicompartmental / total knee prosthesis.',
        },
        tpaProvider: 'HDFC ERGO',
        status: 'APPROVED' as const,
        createdBy: hospitalUser._id,
        assignedTo: tpaUser._id,
        submittedAt: new Date(Date.now() - 2 * 86400000),
        approvedAt: new Date(Date.now() - 12 * 3600000),
      },
      {
        claimId: 'CF-202602-1004',
        patientDetails: {
          name: 'Meenakshi Iyer',
          age: 34,
          gender: 'FEMALE' as const,
          patientId: 'PT-88913',
          contactNumber: '+91 98450 11223',
        },
        insuranceDetails: {
          insuranceCompany: 'ICICI Lombard General Insurance',
          tpaProvider: 'ICICI Lombard',
          policyNumber: 'ICICI-HEALTH-33910',
          policyCoverageLimit: 400000,
          policyExpiryDate: new Date('2026-10-20'),
        },
        admissionDetails: {
          admissionNumber: 'ADM-2026-044',
          admissionDate: new Date('2026-02-14'),
          diagnosis: 'Acute Appendicitis with Localized Peritonitis',
          primaryICD10: 'K35.80',
          cptCodes: ['44970'],
          treatingDepartment: 'General Surgery',
          doctorName: 'Dr. Ananya Sen, MS General Surgery',
        },
        financialDetails: {
          estimatedCost: 95000,
          roomCharges: 15000,
          procedureCharges: 52000,
          medicineCharges: 14000,
          investigationCharges: 9000,
          otherCharges: 5000,
          totalClaimedAmount: 95000,
          currency: 'INR' as const,
        },
        tpaProvider: 'ICICI Lombard',
        status: 'TPA_REVIEW' as const,
        createdBy: hospitalUser._id,
        assignedTo: tpaUser._id,
        submittedAt: new Date(Date.now() - 8 * 3600000),
      },
      {
        claimId: 'CF-202602-1005',
        patientDetails: {
          name: 'Deepak Varma',
          age: 47,
          gender: 'MALE' as const,
          patientId: 'PT-88914',
          contactNumber: '+91 99001 88776',
        },
        insuranceDetails: {
          insuranceCompany: 'New India Assurance Co.',
          tpaProvider: 'Medi Assist',
          policyNumber: 'MEDIASST-NIA-77621',
          policyCoverageLimit: 300000,
          policyExpiryDate: new Date('2026-09-30'),
        },
        admissionDetails: {
          admissionNumber: 'ADM-2026-045',
          admissionDate: new Date('2026-02-14'),
          diagnosis: 'Left Inguinal Hernia (Unilateral, Primary, Incarcerated)',
          primaryICD10: 'K40.90',
          cptCodes: ['49505'],
          treatingDepartment: 'General Surgery',
          doctorName: 'Dr. Vivek Joshi, MS',
        },
        financialDetails: {
          estimatedCost: 82000,
          roomCharges: 14000,
          procedureCharges: 45000,
          medicineCharges: 11000,
          investigationCharges: 7000,
          otherCharges: 5000,
          totalClaimedAmount: 82000,
          currency: 'INR' as const,
        },
        tpaProvider: 'Medi Assist',
        status: 'SUBMITTED' as const,
        createdBy: hospitalUser._id,
        submittedAt: new Date(Date.now() - 4 * 3600000),
      },
      {
        claimId: 'CF-202602-1006',
        patientDetails: {
          name: 'Kavita Joshi',
          age: 29,
          gender: 'FEMALE' as const,
          patientId: 'PT-88915',
          contactNumber: '+91 98860 44556',
        },
        insuranceDetails: {
          insuranceCompany: 'Care Health Insurance',
          tpaProvider: 'Medi Assist',
          policyNumber: 'CARE-JOY-11094',
          policyCoverageLimit: 300000,
          policyExpiryDate: new Date('2026-08-15'),
        },
        admissionDetails: {
          admissionNumber: 'ADM-2026-046',
          admissionDate: new Date('2026-02-15'),
          dischargeDate: new Date('2026-02-17'),
          diagnosis: 'Full-term Normal Vaginal Delivery with episiotomy',
          primaryICD10: 'O80',
          secondaryICD10: ['Z37.0'],
          cptCodes: ['59400'],
          treatingDepartment: 'Obstetrics & Gynecology',
          doctorName: 'Dr. Rekha Chawla, MD OBG',
        },
        financialDetails: {
          estimatedCost: 65000,
          roomCharges: 18000,
          procedureCharges: 28000,
          medicineCharges: 9000,
          investigationCharges: 6000,
          otherCharges: 4000,
          totalClaimedAmount: 65000,
          approvedAmount: 65000,
          sanctionedAmount: 65000,
          currency: 'INR' as const,
          remarks: 'Maternity cashless sanction completed.',
        },
        tpaProvider: 'Medi Assist',
        status: 'SETTLED' as const,
        createdBy: hospitalUser._id,
        assignedTo: tpaUser._id,
        submittedAt: new Date(Date.now() - 5 * 86400000),
        approvedAt: new Date(Date.now() - 4 * 86400000),
        sanctionedAt: new Date(Date.now() - 3 * 86400000),
        settledAt: new Date(Date.now() - 1 * 86400000),
      },
      {
        claimId: 'CF-202602-1007',
        patientDetails: {
          name: 'Arjun Singhania',
          age: 38,
          gender: 'MALE' as const,
          patientId: 'PT-88916',
          contactNumber: '+91 97654 32190',
        },
        insuranceDetails: {
          insuranceCompany: 'Bajaj Allianz General Insurance',
          tpaProvider: 'Medi Assist',
          policyNumber: 'BAJAJ-SILVER-99012',
          policyCoverageLimit: 350000,
          policyExpiryDate: new Date('2026-07-25'),
        },
        admissionDetails: {
          admissionNumber: 'ADM-2026-047',
          admissionDate: new Date('2026-02-15'),
          diagnosis: 'Elective Rhinoplasty & Septoplasty for Aesthetic Contouring',
          primaryICD10: 'Z41.1',
          cptCodes: ['30410'],
          treatingDepartment: 'Plastic & Cosmetic Surgery',
          doctorName: 'Dr. Rohan Mehra, MCh Plastic Surgery',
        },
        financialDetails: {
          estimatedCost: 150000,
          roomCharges: 25000,
          procedureCharges: 95000,
          medicineCharges: 15000,
          investigationCharges: 8000,
          otherCharges: 7000,
          totalClaimedAmount: 150000,
          currency: 'INR' as const,
        },
        tpaProvider: 'Medi Assist',
        status: 'REJECTED' as const,
        rejectionReason: 'Cosmetic / aesthetic procedure excluded under Section 4.2 of policy exclusions.',
        createdBy: hospitalUser._id,
        assignedTo: tpaUser._id,
        submittedAt: new Date(Date.now() - 2 * 86400000),
      },
      {
        claimId: 'CF-202602-1008',
        patientDetails: {
          name: 'Pooja Hegde',
          age: 26,
          gender: 'FEMALE' as const,
          patientId: 'PT-88917',
          contactNumber: '+91 98444 77889',
        },
        insuranceDetails: {
          insuranceCompany: 'Star Health and Allied Insurance',
          tpaProvider: 'Star Health',
          policyNumber: 'STAR-COMP-66120',
          policyCoverageLimit: 400000,
          policyExpiryDate: new Date('2026-12-10'),
        },
        admissionDetails: {
          admissionNumber: 'ADM-2026-048',
          admissionDate: new Date('2026-02-15'),
          diagnosis: 'Acute Dengue Fever with Severe Thrombocytopenia',
          primaryICD10: 'A97.2',
          treatingDepartment: 'Internal Medicine',
          doctorName: 'Dr. Sanjay Gupta, MD Medicine',
        },
        financialDetails: {
          estimatedCost: 48000,
          roomCharges: 12000,
          procedureCharges: 6000,
          medicineCharges: 18000,
          investigationCharges: 9000,
          otherCharges: 3000,
          totalClaimedAmount: 48000,
          currency: 'INR' as const,
        },
        tpaProvider: 'Star Health',
        status: 'DRAFT' as const,
        createdBy: hospitalUser._id,
      },
      {
        claimId: 'CF-202602-1009',
        patientDetails: {
          name: 'Mohammed Rizwan',
          age: 58,
          gender: 'MALE' as const,
          patientId: 'PT-88918',
          contactNumber: '+91 98220 33445',
        },
        insuranceDetails: {
          insuranceCompany: 'Niva Bupa Health Insurance',
          tpaProvider: 'Niva Bupa',
          policyNumber: 'NIVA-SENIOR-11209',
          policyCoverageLimit: 500000,
          policyExpiryDate: new Date('2027-02-28'),
        },
        admissionDetails: {
          admissionNumber: 'ADM-2026-049',
          admissionDate: new Date('2026-02-16'),
          diagnosis: 'Benign Prostatic Hyperplasia (BPH) with Lower Urinary Tract Symptoms',
          primaryICD10: 'N40.1',
          cptCodes: ['52601'],
          treatingDepartment: 'Urology',
          doctorName: 'Dr. Tariq Sheikh, MCh Urology',
        },
        financialDetails: {
          estimatedCost: 110000,
          roomCharges: 22000,
          procedureCharges: 58000,
          medicineCharges: 14000,
          investigationCharges: 10000,
          otherCharges: 6000,
          totalClaimedAmount: 110000,
          currency: 'INR' as const,
        },
        tpaProvider: 'Niva Bupa',
        status: 'DRAFT' as const,
        createdBy: hospitalUser._id,
      },
      {
        claimId: 'CF-202602-1010',
        patientDetails: {
          name: 'Geeta Nair',
          age: 67,
          gender: 'FEMALE' as const,
          patientId: 'PT-88919',
          contactNumber: '+91 97400 66778',
        },
        insuranceDetails: {
          insuranceCompany: 'HDFC ERGO General Insurance',
          tpaProvider: 'HDFC ERGO',
          policyNumber: 'HDFC-SILVER-55201',
          policyCoverageLimit: 600000,
          policyExpiryDate: new Date('2026-11-30'),
        },
        admissionDetails: {
          admissionNumber: 'ADM-2026-050',
          admissionDate: new Date('2026-02-16'),
          diagnosis: 'Senile Nuclear Cataract Left Eye with Visually Significant Opacification',
          primaryICD10: 'H25.12',
          cptCodes: ['66984'],
          treatingDepartment: 'Ophthalmology',
          doctorName: 'Dr. Shilpa Murthy, MS Ophth',
        },
        financialDetails: {
          estimatedCost: 55000,
          roomCharges: 8000,
          procedureCharges: 38000,
          medicineCharges: 5000,
          investigationCharges: 3000,
          otherCharges: 1000,
          totalClaimedAmount: 55000,
          approvedAmount: 52000,
          currency: 'INR' as const,
          remarks: 'Phacoemulsification with Foldable Monofocal Intraocular Lens.',
        },
        tpaProvider: 'HDFC ERGO',
        status: 'APPROVED' as const,
        createdBy: hospitalUser._id,
        assignedTo: tpaUser._id,
        submittedAt: new Date(Date.now() - 1 * 86400000),
        approvedAt: new Date(Date.now() - 4 * 3600000),
      },
      {
        claimId: 'CF-202602-1011',
        patientDetails: {
          name: 'Naveen Chandra',
          age: 44,
          gender: 'MALE' as const,
          patientId: 'PT-88920',
          contactNumber: '+91 98190 55443',
        },
        insuranceDetails: {
          insuranceCompany: 'ICICI Lombard General Insurance',
          tpaProvider: 'ICICI Lombard',
          policyNumber: 'ICICI-GROUP-22108',
          policyCoverageLimit: 500000,
          policyExpiryDate: new Date('2026-10-31'),
        },
        admissionDetails: {
          admissionNumber: 'ADM-2026-051',
          admissionDate: new Date('2026-02-16'),
          diagnosis: 'Chronic Sinusitis with Nasal Polyposis',
          primaryICD10: 'J32.9',
          cptCodes: ['31237'],
          treatingDepartment: 'ENT',
          doctorName: 'Dr. Harish Bhatt, MS ENT',
        },
        financialDetails: {
          estimatedCost: 78000,
          roomCharges: 14000,
          procedureCharges: 44000,
          medicineCharges: 10000,
          investigationCharges: 6000,
          otherCharges: 4000,
          totalClaimedAmount: 78000,
          currency: 'INR' as const,
        },
        tpaProvider: 'ICICI Lombard',
        status: 'TPA_REVIEW' as const,
        createdBy: hospitalUser._id,
        assignedTo: tpaUser._id,
        submittedAt: new Date(Date.now() - 10 * 3600000),
      },
      {
        claimId: 'CF-202602-1012',
        patientDetails: {
          name: 'Lavanya Krishnan',
          age: 31,
          gender: 'FEMALE' as const,
          patientId: 'PT-88921',
          contactNumber: '+91 99887 66554',
        },
        insuranceDetails: {
          insuranceCompany: 'Star Health and Allied Insurance',
          tpaProvider: 'Star Health',
          policyNumber: 'STAR-INDIV-88712',
          policyCoverageLimit: 300000,
          policyExpiryDate: new Date('2026-12-25'),
        },
        admissionDetails: {
          admissionNumber: 'ADM-2026-052',
          admissionDate: new Date('2026-02-17'),
          diagnosis: 'Right Ovarian Dermoid Cyst (Teratoma)',
          primaryICD10: 'D27.0',
          cptCodes: ['58662'],
          treatingDepartment: 'Gynecology',
          doctorName: 'Dr. Rekha Chawla, MD OBG',
        },
        financialDetails: {
          estimatedCost: 115000,
          roomCharges: 22000,
          procedureCharges: 62000,
          medicineCharges: 16000,
          investigationCharges: 9000,
          otherCharges: 6000,
          totalClaimedAmount: 115000,
          currency: 'INR' as const,
        },
        tpaProvider: 'Star Health',
        status: 'SUBMITTED' as const,
        createdBy: hospitalUser._id,
        submittedAt: new Date(Date.now() - 2 * 3600000),
      },
    ];

    console.log('[Seed] Inserting claims and creating associated documents, AI extractions, and queries...');
    let insertedCount = 0;
    let skippedCount = 0;

    for (const claimData of sampleClaimsData) {
      const existing = await Claim.findOne({ claimId: claimData.claimId });
      if (existing) {
        skippedCount++;
        continue;
      }

      const claim = await Claim.create(claimData);
      insertedCount++;

      // Create sample document
      const doc = await Document.create({
        claimId: claim._id,
        fileName: 'demo-admission-summary.pdf',
        originalName: `${claim.patientDetails.name.replace(/\s+/g, '_')}_Admission_Summary.pdf`,
        mimeType: 'application/pdf',
        storageKey: sampleDocPath,
        fileSize: 1024 * 128,
        uploadedBy: hospitalUser._id,
        documentType: 'ADMISSION_NOTE',
        extractedText: `Patient: ${claim.patientDetails.name}\nAge: ${claim.patientDetails.age} Gender: ${claim.patientDetails.gender}\nPolicy: ${claim.insuranceDetails.policyNumber}\nDiagnosis: ${claim.admissionDetails.diagnosis}\nPrimary ICD-10: ${claim.admissionDetails.primaryICD10}\nTreating Doctor: ${claim.admissionDetails.doctorName}\nTotal Estimated Cost: INR ${claim.financialDetails.totalClaimedAmount}`,
      });

      // Create realistic AI extraction record
      const isUncertain = claim.status === 'DRAFT' && claim.claimId === 'CF-202602-1008';
      await AIExtraction.create({
        claimId: claim._id,
        documentId: doc._id,
        model: 'gemini-2.5-flash',
        extractedFields: {
          patientName: {
            value: claim.patientDetails.name,
            confidence: 0.95,
            sourceEvidence: `Patient: ${claim.patientDetails.name}`,
            isVerified: true,
          },
          policyNumber: {
            value: claim.insuranceDetails.policyNumber,
            confidence: 0.92,
            sourceEvidence: `Policy: ${claim.insuranceDetails.policyNumber}`,
            isVerified: true,
          },
          diagnosis: {
            value: claim.admissionDetails.diagnosis,
            confidence: isUncertain ? 0.72 : 0.89,
            sourceEvidence: `Diagnosis: ${claim.admissionDetails.diagnosis}`,
            isVerified: !isUncertain,
          },
          claimedAmount: {
            value: claim.financialDetails.totalClaimedAmount,
            confidence: 0.94,
            sourceEvidence: `Total Estimated Cost: INR ${claim.financialDetails.totalClaimedAmount}`,
            isVerified: true,
          },
          icdCodes: [
            {
              code: claim.admissionDetails.primaryICD10 || 'R69',
              description: claim.admissionDetails.diagnosis,
              confidence: isUncertain ? 0.68 : 0.91,
              isPrimary: true,
            },
          ],
          cptCodes: (claim.admissionDetails.cptCodes || []).map((c) => ({
            code: c,
            description: 'Surgical procedure',
            confidence: 0.88,
          })),
          missingFields: [],
          warnings: isUncertain ? ['Low confidence for diagnosis code - needs physician verification'] : [],
        },
        validationResults: {
          isValid: true,
          hasLowConfidenceFields: isUncertain,
          uncertainFields: isUncertain ? ['diagnosis', 'icdCodes'] : [],
          missingMandatoryFields: [],
        },
        warnings: isUncertain ? ['Low confidence for clinical code'] : [],
        requiresManualReview: isUncertain,
        processingStatus: 'COMPLETED',
      });

      // Create TPA query for QUERY_RAISED claim
      if (claim.status === 'QUERY_RAISED') {
        await TPAQuery.create({
          claimId: claim._id,
          queryText:
            'Please upload the latest abdominal ultrasound / MRCP report and serum amylase/lipase values to substantiate choledocholithiasis before surgical approval can be processed.',
          deadline: new Date(Date.now() + 24 * 3600000), // 24 hours deadline
          status: 'OPEN',
          raisedBy: tpaUser._id,
          supportingDocuments: [],
        });

        await AuditLog.create({
          claimId: claim._id,
          action: 'QUERY_RAISED',
          entityType: 'QUERY',
          performedBy: tpaUser._id,
          performedByRole: 'TPA_MANAGER',
          newValue: {
            query: 'Uploaded MRCP report requested',
            deadline: new Date(Date.now() + 24 * 3600000),
          },
          details: { message: 'TPA underwriter raised mandatory query with 24-hour SLA.' },
          timestamp: new Date(Date.now() - 4 * 3600000),
        });
      }

      // Initial creation audit log
      await AuditLog.create({
        claimId: claim._id,
        action: 'CLAIM_CREATED',
        entityType: 'CLAIM',
        performedBy: hospitalUser._id,
        performedByRole: 'HOSPITAL_STAFF',
        newValue: {
          claimId: claim.claimId,
          patientName: claim.patientDetails.name,
          claimedAmount: claim.financialDetails.totalClaimedAmount,
        },
        details: { message: 'Initial cashless claim registered in workspace.' },
        timestamp: claim.createdAt || new Date(Date.now() - 4 * 86400000),
      });

      if (claim.submittedAt) {
        await AuditLog.create({
          claimId: claim._id,
          action: 'CLAIM_SUBMITTED',
          entityType: 'CLAIM',
          performedBy: hospitalUser._id,
          performedByRole: 'HOSPITAL_STAFF',
          newValue: { status: 'SUBMITTED', submittedAt: claim.submittedAt },
          details: { message: 'Claim submitted to TPA review queue.' },
          timestamp: claim.submittedAt,
        });
      }

      if (claim.approvedAt) {
        await AuditLog.create({
          claimId: claim._id,
          action: 'CLAIM_APPROVED',
          entityType: 'FINANCIAL',
          performedBy: tpaUser._id,
          performedByRole: 'TPA_MANAGER',
          newValue: {
            status: 'APPROVED',
            approvedAmount: claim.financialDetails.approvedAmount,
          },
          details: {
            message: `Pre-authorization approved for ₹${(claim.financialDetails.approvedAmount || 0).toLocaleString('en-IN')}`,
          },
          timestamp: claim.approvedAt,
        });
      }
    }

    console.log(`✅ [Seed] Done! Inserted ${insertedCount} claims, skipped ${skippedCount} existing claims.`);
    console.log('------------------------------------------------------------');
    console.log('Demo Credentials:');
    console.log('Hospital Staff: hospital@claimflow.demo / HospitalStaff@2026!');
    console.log('TPA Manager:    tpa@claimflow.demo      / TPAManager@2026!');
    console.log('------------------------------------------------------------');
  } catch (error) {
    console.error('❌ [Seed] Error during seeding:', error);
    throw error;
  } finally {
    if (shouldDisconnect) {
      await disconnectDB();
    }
  }
};

// Execute if run directly
if (process.argv[1] && (/seed\.(ts|js)$/i.test(process.argv[1]) || process.argv[1].endsWith('seed.ts'))) {
  runSeed(true)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
