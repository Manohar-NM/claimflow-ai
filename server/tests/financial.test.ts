import { describe, expect, it } from 'vitest';
import { FinancialService } from '../src/services/financialService.js';

describe('Financial Validation Engine Tests (INR)', () => {
  it('should accurately calculate total claim components and flag discrepancies', () => {
    const financials = {
      estimatedCost: 100000,
      roomCharges: 20000,
      procedureCharges: 50000,
      medicineCharges: 20000,
      investigationCharges: 7000,
      otherCharges: 3000,
      totalClaimedAmount: 100000, // Matches 20k + 50k + 20k + 7k + 3k
      currency: 'INR' as const,
    };

    const insurance = {
      insuranceCompany: 'Star Health',
      tpaProvider: 'Star Health',
      policyNumber: 'STAR-01',
      policyCoverageLimit: 500000,
      policyExpiryDate: new Date(),
    };

    const result = FinancialService.validateFinancials(financials, insurance);
    expect(result.isValid).toBe(true);
    expect(result.calculatedTotal).toBe(100000);
    expect(result.differenceWithBreakdown).toBe(0);
    expect(result.exceedingCoverageAmount).toBe(0);
    expect(result.warnings.length).toBe(0);
  });

  it('should flag discrepancy when itemized breakdown does not match total claimed amount', () => {
    const financials = {
      estimatedCost: 100000,
      roomCharges: 20000,
      procedureCharges: 40000, // Total = 60000, but claimed is 100000
      medicineCharges: 0,
      investigationCharges: 0,
      otherCharges: 0,
      totalClaimedAmount: 100000,
      currency: 'INR' as const,
    };

    const insurance = {
      insuranceCompany: 'HDFC ERGO',
      tpaProvider: 'HDFC ERGO',
      policyNumber: 'HDFC-02',
      policyCoverageLimit: 500000,
      policyExpiryDate: new Date(),
    };

    const result = FinancialService.validateFinancials(financials, insurance);
    expect(result.differenceWithBreakdown).toBe(40000);
    expect(result.warnings.some((w) => w.includes('does not match claimed amount'))).toBe(true);
  });

  it('should calculate exceeding policy limit amount correctly', () => {
    const financials = {
      estimatedCost: 750000,
      roomCharges: 100000,
      procedureCharges: 450000,
      medicineCharges: 100000,
      investigationCharges: 50000,
      otherCharges: 50000,
      totalClaimedAmount: 750000,
      currency: 'INR' as const,
    };

    const insurance = {
      insuranceCompany: 'Medi Assist',
      tpaProvider: 'Medi Assist',
      policyNumber: 'MED-03',
      policyCoverageLimit: 500000, // Cap is 500k, claimed is 750k
      policyExpiryDate: new Date(),
    };

    const result = FinancialService.validateFinancials(financials, insurance);
    expect(result.exceedingCoverageAmount).toBe(250000);
    expect(result.warnings.some((w) => w.includes('exceeds total policy coverage limit'))).toBe(true);
  });

  it('should enforce approved amount rules for TPA approval', () => {
    // Case 1: Approved amount > Claimed amount without exception -> Invalid
    const validation1 = FinancialService.validateApprovedAmount(100000, 120000, 500000);
    expect(validation1.isValid).toBe(false);
    expect(validation1.message).toContain('cannot exceed claimed amount');

    // Case 2: Negative approved amount -> Invalid
    const validation2 = FinancialService.validateApprovedAmount(100000, -1000, 500000);
    expect(validation2.isValid).toBe(false);

    // Case 3: Approved amount <= Claimed and within policy limit -> Valid
    const validation3 = FinancialService.validateApprovedAmount(100000, 95000, 500000);
    expect(validation3.isValid).toBe(true);
  });
});
