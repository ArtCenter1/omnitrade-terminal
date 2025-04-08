/// <reference types="vitest/globals" />

vi.mock('@/integrations/supabase/client', () => {
  const mockResetPasswordForEmail = vi.fn();
  const mockOnAuthStateChange = vi.fn().mockReturnValue({
    data: {
      subscription: {
        unsubscribe: vi.fn(),
      },
    },
  });
  const mockGetSession = vi.fn().mockResolvedValue({
    data: { session: null },
  });

  return {
    supabase: {
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
        onAuthStateChange: mockOnAuthStateChange,
        getSession: mockGetSession,
      },
    },
  };
});

import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

describe('AuthContext - resetPassword', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );

  // Get a reference to the mock function after mocking
  const mockResetPasswordForEmail = supabase.auth.resetPasswordForEmail as any;

  it('calls supabase.auth.resetPasswordForEmail with correct email and redirect URL', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    const testEmail = 'test@example.com';

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.resetPassword(testEmail);
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(testEmail, expect.objectContaining({
        redirectTo: expect.stringContaining('/auth/reset-password'),
      }));
      expect(response).toEqual({ error: null, success: true });
    });
  });

  it('handles error returned by supabase.auth.resetPasswordForEmail', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'Reset failed' } });
    const testEmail = 'fail@example.com';

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.resetPassword(testEmail);
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });
});