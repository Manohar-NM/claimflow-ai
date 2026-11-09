import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { config } from '../config/index.js';
import { ExtractedFieldsPayload, FieldExtraction } from '../types/index.js';

export interface AIServiceResponse {
  success: boolean;
  status: 'COMPLETED' | 'FAILED' | 'UNAVAILABLE';
  modelUsed: string;
  extractedFields?: ExtractedFieldsPayload;
  uncertainFields: string[];
  missingMandatoryFields: string[];
  warnings: string[];
  errorMessage?: string;
  requiresManualReview: boolean;
}

export class AIService {
  /**
   * Deterministic confidence calibrator that calculates confidence from
   * source evidence grounding, regex pattern validation, and document text quality.
   */
  public static calculateConfidence<T>(
    fieldName: string,
    value: T | null | undefined,
    sourceEvidence: string | undefined,
    rawDocumentText: string
  ): number {
    if (value === null || value === undefined || value === '') {
      return 0.0;
    }

    let score = 0.50; // Base score for non-empty extracted field
    const docLower = rawDocumentText.toLowerCase();
    const strVal = String(value).trim().toLowerCase();

    // 1. Text Evidence Grounding (+0.25 if verbatim in document text)
    if (strVal.length > 2 && docLower.includes(strVal)) {
      score += 0.25;
    } else if (sourceEvidence && sourceEvidence.trim().length > 3) {
      const evidenceLower = sourceEvidence.toLowerCase();
      if (docLower.includes(evidenceLower)) {
        score += 0.15;
      }
    }

    // 2. Format & Domain Validation (+0.15 - +0.20)
    switch (fieldName) {
      case 'icdCodes':
      case 'primaryICD10':
        // Standard ICD-10 pattern (e.g. I21.9, K35.8, E11.9)
        if (/^[A-Z][0-9]{2}(\.[0-9]{1,4})?$/i.test(String(value).trim())) {
          score += 0.20;
        } else {
          score -= 0.15;
        }
        break;

      case 'cptCodes':
        // Standard CPT 5-digit code
        if (/^[0-9]{5}$/.test(String(value).trim())) {
          score += 0.20;
        } else {
          score -= 0.15;
        }
        break;

      case 'policyNumber':
        // Standard policy pattern
        if (/^[A-Z0-9-]{6,25}$/i.test(String(value).trim())) {
          score += 0.15;
        }
        break;

      case 'claimedAmount':
        if (typeof value === 'number' && value > 0 && Number.isFinite(value)) {
          score += 0.15;
        }
        break;

      case 'admissionDate':
      case 'dischargeDate':
        if (!isNaN(Date.parse(String(value)))) {
          score += 0.15;
        } else {
          score -= 0.25;
        }
        break;
    }

    // 3. Document text readability check
    if (rawDocumentText.length < 80) {
      score -= 0.20; // Short or fragmented OCR text penalty
    }

    // Cap between 0.10 and 0.98
    return Math.min(0.98, Math.max(0.10, Math.round(score * 100) / 100));
  }

  /**
   * Evaluates structured fields against confidence threshold (0.80) and rules.
   */
  public static evaluateUncertainty(
    payload: Partial<ExtractedFieldsPayload>,
    rawDocumentText: string
  ): {
    evaluatedPayload: ExtractedFieldsPayload;
    uncertainFields: string[];
    missingMandatoryFields: string[];
    warnings: string[];
    requiresManualReview: boolean;
  } {
    const uncertainFields: string[] = [];
    const missingMandatoryFields: string[] = [];
    const warnings: string[] = [...(payload.warnings || [])];

    // Helper to evaluate a scalar field
    const evalField = <T>(
      name: string,
      field: FieldExtraction<T> | undefined,
      isMandatory: boolean = false
    ): FieldExtraction<T> => {
      const val = field?.value ?? null;
      const confidence = AIService.calculateConfidence(
        name,
        val,
        field?.sourceEvidence,
        rawDocumentText
      );

      const isUncertain = val === null || confidence < config.confidenceThreshold;

      if (isUncertain) {
        uncertainFields.push(name);
      }

      if (isMandatory && (val === null || val === undefined || val === '')) {
        missingMandatoryFields.push(name);
      }

      return {
        value: val,
        confidence,
        sourceEvidence: field?.sourceEvidence || '',
        isVerified: field?.isVerified || false,
        verifiedValue: field?.verifiedValue,
        verifiedBy: field?.verifiedBy,
        verifiedAt: field?.verifiedAt,
        verificationReason: field?.verificationReason,
      };
    };

    const evaluatedPatientName = evalField('patientName', payload.patientName, true);
    const evaluatedPolicyNumber = evalField('policyNumber', payload.policyNumber, true);
    const evaluatedDiagnosis = evalField('diagnosis', payload.diagnosis, true);
    const evaluatedAdmissionDate = evalField('admissionDate', payload.admissionDate, true);
    const evaluatedDischargeDate = evalField('dischargeDate', payload.dischargeDate, false);
    const evaluatedClaimedAmount = evalField('claimedAmount', payload.claimedAmount, true);
    const evaluatedPolicyLimit = evalField('policyLimit', payload.policyLimit, false);

    // Evaluate ICD Codes
    const icdCodes = (payload.icdCodes || []).map((codeObj) => ({
      ...codeObj,
      confidence: AIService.calculateConfidence(
        'icdCodes',
        codeObj.code,
        codeObj.description,
        rawDocumentText
      ),
    }));

    if (icdCodes.length === 0) {
      warnings.push('No ICD-10 diagnosis codes were extracted from the document');
      uncertainFields.push('icdCodes');
      missingMandatoryFields.push('icdCodes');
    }

    // Evaluate CPT Codes
    const cptCodes = (payload.cptCodes || []).map((codeObj) => ({
      ...codeObj,
      confidence: AIService.calculateConfidence(
        'cptCodes',
        codeObj.code,
        codeObj.description,
        rawDocumentText
      ),
    }));

    if (cptCodes.length === 0) {
      warnings.push('No CPT / procedure codes detected in clinical documentation');
    }

    const requiresManualReview =
      uncertainFields.length > 0 || missingMandatoryFields.length > 0;

    const evaluatedPayload: ExtractedFieldsPayload = {
      patientName: evaluatedPatientName,
      policyNumber: evaluatedPolicyNumber,
      diagnosis: evaluatedDiagnosis,
      admissionDate: evaluatedAdmissionDate,
      dischargeDate: evaluatedDischargeDate,
      claimedAmount: evaluatedClaimedAmount,
      policyLimit: evaluatedPolicyLimit,
      icdCodes,
      cptCodes,
      billComponents: payload.billComponents || [],
      missingFields: Array.from(new Set([...missingMandatoryFields, ...(payload.missingFields || [])])),
      warnings: Array.from(new Set(warnings)),
    };

    return {
      evaluatedPayload,
      uncertainFields,
      missingMandatoryFields,
      warnings,
      requiresManualReview,
    };
  }

  /**
   * Analyzes document text with the real configured AI model (Gemini or OpenAI).
   */
  public static async analyzeDocument(
    documentText: string,
    documentType: string
  ): Promise<AIServiceResponse> {
    const isGemini = config.aiProvider === 'gemini' && !!config.geminiApiKey;
    const isOpenAI = config.aiProvider === 'openai' && !!config.openaiApiKey;

    if (!isGemini && !isOpenAI) {
      return {
        success: false,
        status: 'UNAVAILABLE',
        modelUsed: 'NONE',
        uncertainFields: ['all'],
        missingMandatoryFields: ['patientName', 'policyNumber', 'diagnosis', 'claimedAmount', 'icdCodes'],
        warnings: [
          'AI extraction service is not configured. Please supply GEMINI_API_KEY or OPENAI_API_KEY in server environment variables.',
        ],
        errorMessage: 'AI Provider API key missing. Manual entry required.',
        requiresManualReview: true,
      };
    }

    const systemPrompt = `You are a clinical and medical claims coding specialist AI for ClaimFlow AI.
Analyze the following hospital document (${documentType}) and extract structured claims information strictly according to this JSON schema.
Never fabricate or invent missing information. If a field is not present in the document text, return null.

Required JSON Structure:
{
  "patientName": { "value": string or null, "sourceEvidence": string },
  "age": { "value": number or null, "sourceEvidence": string },
  "gender": { "value": "MALE" | "FEMALE" | "OTHER" | null, "sourceEvidence": string },
  "policyNumber": { "value": string or null, "sourceEvidence": string },
  "tpaProvider": { "value": string or null, "sourceEvidence": string },
  "admissionDate": { "value": "YYYY-MM-DD" or null, "sourceEvidence": string },
  "dischargeDate": { "value": "YYYY-MM-DD" or null, "sourceEvidence": string },
  "diagnosis": { "value": string or null, "sourceEvidence": string },
  "icdCodes": [
    { "code": "e.g. I21.9", "description": string, "isPrimary": boolean }
  ],
  "cptCodes": [
    { "code": "e.g. 99223", "description": string }
  ],
  "billComponents": [
    { "description": string, "amount": number, "category": "ROOM" | "PROCEDURE" | "MEDICINE" | "INVESTIGATION" | "OTHER" }
  ],
  "claimedAmount": { "value": number or null, "sourceEvidence": string },
  "policyLimit": { "value": number or null, "sourceEvidence": string },
  "missingFields": [ string ],
  "warnings": [ string ]
}

Return ONLY valid JSON. No markdown backticks, no explanations.`;

    try {
      let rawJsonString = '';
      let modelUsed = '';

      if (isGemini) {
        modelUsed = config.geminiModel;
        const genAI = new GoogleGenerativeAI(config.geminiApiKey);
        const model = genAI.getGenerativeModel({
          model: modelUsed,
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const prompt = `${systemPrompt}\n\nDocument Text:\n"""\n${documentText.slice(0, 25000)}\n"""`;
        const result = await model.generateContent(prompt);
        rawJsonString = result.response.text();
      } else if (isOpenAI) {
        modelUsed = config.openaiModel;
        const openai = new OpenAI({ apiKey: config.openaiApiKey });
        const response = await openai.chat.completions.create({
          model: modelUsed,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Document Text:\n"""\n${documentText.slice(0, 25000)}\n"""` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        });
        rawJsonString = response.choices[0]?.message?.content || '{}';
      }

      // Parse JSON safely
      let parsedOutput: Partial<ExtractedFieldsPayload>;
      try {
        let cleaned = rawJsonString.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        }
        parsedOutput = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('[AIService] Failed to parse model output:', rawJsonString);
        return {
          success: false,
          status: 'FAILED',
          modelUsed,
          uncertainFields: ['all'],
          missingMandatoryFields: ['patientName', 'policyNumber', 'diagnosis', 'claimedAmount'],
          warnings: ['AI output could not be parsed into valid JSON structure.'],
          errorMessage: 'Malformed AI response format.',
          requiresManualReview: true,
        };
      }

      // Run uncertainty evaluation & calibration
      const evaluation = AIService.evaluateUncertainty(parsedOutput, documentText);

      return {
        success: true,
        status: 'COMPLETED',
        modelUsed,
        extractedFields: evaluation.evaluatedPayload,
        uncertainFields: evaluation.uncertainFields,
        missingMandatoryFields: evaluation.missingMandatoryFields,
        warnings: evaluation.warnings,
        requiresManualReview: evaluation.requiresManualReview,
      };
    } catch (apiError: any) {
      console.error('[AIService] Error calling AI model API:', apiError.message);
      return {
        success: false,
        status: 'FAILED',
        modelUsed: config.aiProvider,
        uncertainFields: ['all'],
        missingMandatoryFields: ['patientName', 'policyNumber', 'diagnosis', 'claimedAmount'],
        warnings: [`External AI API call failed: ${apiError.message}`],
        errorMessage: apiError.message,
        requiresManualReview: true,
      };
    }
  }
}

