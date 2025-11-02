import { supabase } from './supabase';

export interface EmailError {
  code: string;
  message: string;
  isBounce: boolean;
  isInvalidEmail: boolean;
}

class EmailService {
  /**
   * Resend verification email to the user
   */
  async resendVerificationEmail(email: string): Promise<{ error: EmailError | null }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: undefined, // No redirect needed for mobile
        },
      });

      if (error) {
        return {
          error: this.parseEmailError(error),
        };
      }

      return { error: null };
    } catch (error: any) {
      return {
        error: this.parseEmailError(error),
      };
    }
  }

  /**
   * Resend password reset email
   */
  async resendPasswordResetEmail(email: string): Promise<{ error: EmailError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: undefined, // No redirect needed for mobile
      });

      if (error) {
        return {
          error: this.parseEmailError(error),
        };
      }

      return { error: null };
    } catch (error: any) {
      return {
        error: this.parseEmailError(error),
      };
    }
  }

  /**
   * Check if email is verified
   */
  async isEmailVerified(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.email_confirmed_at !== null;
    } catch {
      return false;
    }
  }

  /**
   * Parse email errors to identify bounces and invalid emails
   */
  parseEmailError(error: any): EmailError {
    const errorCode = error?.code || '';
    const errorMessage = error?.message || 'Email delivery failed';

    // Common email bounce error codes from Supabase/email providers
    const bounceCodes = [
      'email_not_confirmed',
      'email_rate_limit_exceeded',
      'invalid_email',
      'invalid_request',
      'email_provider_error',
      'email_delivery_failed',
      'smtp_error',
      'mailbox_full',
      'mailbox_not_found',
      'address_invalid',
      'domain_not_found',
    ];

    // Invalid email indicators
    const invalidEmailIndicators = [
      'invalid_email',
      'address_invalid',
      'domain_not_found',
      'mailbox_not_found',
    ];

    const isBounce = bounceCodes.some(code => 
      errorCode.toLowerCase().includes(code.toLowerCase()) ||
      errorMessage.toLowerCase().includes('bounce') ||
      errorMessage.toLowerCase().includes('undeliverable') ||
      errorMessage.toLowerCase().includes('delivery failed') ||
      errorMessage.toLowerCase().includes('rejected')
    );

    const isInvalidEmail = invalidEmailIndicators.some(indicator =>
      errorCode.toLowerCase().includes(indicator.toLowerCase()) ||
      errorMessage.toLowerCase().includes('invalid email') ||
      errorMessage.toLowerCase().includes('invalid address') ||
      errorMessage.toLowerCase().includes('domain not found')
    );

    return {
      code: errorCode,
      message: errorMessage,
      isBounce,
      isInvalidEmail,
    };
  }

  /**
   * Get user-friendly error message for email errors
   */
  getErrorMessage(emailError: EmailError): string {
    if (emailError.isInvalidEmail) {
      return 'This email address is invalid. Please check and try again.';
    }

    if (emailError.isBounce) {
      return 'We couldn\'t deliver the email. Please check your email address or try again later.';
    }

    // Rate limiting
    if (emailError.code?.includes('rate_limit') || emailError.message?.toLowerCase().includes('rate limit')) {
      return 'Too many emails sent. Please wait a few minutes before trying again.';
    }

    // Generic error
    return emailError.message || 'Failed to send email. Please try again.';
  }
}

export const emailService = new EmailService();

