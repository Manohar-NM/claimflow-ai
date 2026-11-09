import { FinancialDetails, InsuranceDetails } from '../types/index.js';

export interface FinancialValidationResult {
  isValid: boolean;
  calculatedTotal: number;
  totalClaimedAmount: number;
  differenceWithBreakdown: number;
  policyLimit: number;
  exceedingCoverageAmount: number;
  remainingCoverage: number;
  approvedAmount?: number;
  deductionAmount?: number;
  warnings: string[];
  errors: string[];
}

export class FinancialService {
  /**
   * Deterministically validates itemized bill calculations against claimed total and policy limits.
   */
  public static validateFinancials(
    financials: FinancialDetails,
    insurance: InsuranceDetails
  ): FinancialValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Ensure non-negative numbers
    const {
      roomCharges = 0,
      procedureCharges = 0,
      medicineCharges = 0,
      investigationCharges = 0,
      otherCharges = 0,
      totalClaimedAmount = 0,
      approvedAmount,
    } = financials;

    if (
      roomCharges < 0 ||
      procedureCharges < 0 ||
      medicineCharges < 0 ||
      investigationCharges < 0 ||
      otherCharges < 0 ||
      totalClaimedAmount < 0
    ) {
      errors.push('Financial line items cannot be negative');
    }

    const calculatedTotal =
      roomCharges +
      procedureCharges +
      medicineCharges +
      investigationCharges +
      otherCharges;

    const differenceWithBreakdown = Math.abs(calculatedTotal - totalClaimedAmount);
    if (differenceWithBreakdown > 1) {
      warnings.push(
        `Itemized breakdown total (₹${calculatedTotal.toLocaleString('en-IN')}) does not match claimed amount (₹${totalClaimedAmount.toLocaleString('en-IN')}). Discrepancy: ₹${differenceWithBreakdown.toLocaleString('en-IN')}`
      );
    }

    const policyLimit = insurance.policyCoverageLimit || 0;
    const exceedingCoverageAmount = Math.max(0, totalClaimedAmount - policyLimit);
    const remainingCoverage = Math.max(0, policyLimit - (approvedAmount ?? totalClaimedAmount));

    if (totalClaimedAmount > policyLimit) {
      warnings.push(
        `Total claimed amount (₹${totalClaimedAmount.toLocaleString('en-IN')}) exceeds total policy coverage limit (₹${policyLimit.toLocaleString('en-IN')}) by ₹${exceedingCoverageAmount.toLocaleString('en-IN')}`
      );
    }

    let deductionAmount = 0;
    if (approvedAmount !== undefined) {
      if (approvedAmount < 0) {
        errors.push('Approved amount cannot be negative');
      }
      if (approvedAmount > totalClaimedAmount) {
        warnings.push(
          `Approved amount (₹${approvedAmount.toLocaleString('en-IN')}) exceeds claimed amount (₹${totalClaimedAmount.toLocaleString('en-IN')}) - requires documented exception approval.`
        );
      }
      deductionAmount = Math.max(0, totalClaimedAmount - approvedAmount);
    }

    return {
      isValid: errors.length === 0,
      calculatedTotal,
      totalClaimedAmount,
      differenceWithBreakdown,
      policyLimit,
      exceedingCoverageAmount,
      remainingCoverage,
      approvedAmount,
      deductionAmount,
      warnings,
      errors,
    };
  }

  /**
   * Deterministically validates an approved amount entered by TPA.
   */
  public static validateApprovedAmount(
    claimedAmount: number,
    approvedAmount: number,
    policyLimit: number,
    allowException: boolean = false
  ): { isValid: boolean; message?: string } {
    if (approvedAmount < 0) {
      return { isValid: false, message: 'Approved amount cannot be negative' };
    }
    if (approvedAmount > claimedAmount && !allowException) {
      return {
        isValid: false,
        message: `Approved amount (₹${approvedAmount.toLocaleString('en-IN')}) cannot exceed claimed amount (₹${claimedAmount.toLocaleString('en-IN')}) without explicit documented exception.`,
      };
    }
    if (approvedAmount > policyLimit && !allowException) {
      return {
        isValid: false,
        message: `Approved amount (₹${approvedAmount.toLocaleString('en-IN')}) exceeds policy coverage limit (₹${policyLimit.toLocaleString('en-IN')}).`,
      };
    }
    return { isValid: true };
  }
}

