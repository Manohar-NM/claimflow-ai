import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { StatusBadge } from '../components/common/StatusBadge';
import { CurrencyFormatter } from '../components/common/CurrencyFormatter';
import { StatCard } from '../components/common/StatCard';
import { FileText } from 'lucide-react';
import { LoginPage } from '../pages/auth/LoginPage';
import { AuthProvider } from '../context/AuthContext';

describe('Frontend Component Tests', () => {
  it('should render StatusBadge with appropriate text and styles', () => {
    const { rerender } = render(<StatusBadge status="DRAFT" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();

    rerender(<StatusBadge status="QUERY_RAISED" />);
    expect(screen.getByText('Query Raised')).toBeInTheDocument();

    rerender(<StatusBadge status="APPROVED" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();

    rerender(<StatusBadge status="SANCTIONED" />);
    expect(screen.getByText('Sanctioned')).toBeInTheDocument();
  });

  it('should format INR currency properly with commas and prefix', () => {
    render(<CurrencyFormatter amount={285000} />);
    expect(screen.getByText('₹2,85,000')).toBeInTheDocument();
  });

  it('should render StatCard with title, value, and icon', () => {
    render(
      <StatCard
        title="Active Claims"
        value={42}
        subtitle="Current month"
        icon={FileText}
        variant="blue"
      />
    );
    expect(screen.getByText('Active Claims')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Current month')).toBeInTheDocument();
  });

  it('should render Login Page with Demo Account buttons and form fields', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('ClaimFlow AI')).toBeInTheDocument();
    expect(screen.getByText('Hospital Staff')).toBeInTheDocument();
    expect(screen.getByText('TPA Underwriter')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@hospital.org')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••••••')).toBeInTheDocument();
  });
});
