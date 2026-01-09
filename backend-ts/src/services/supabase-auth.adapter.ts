/**
 * Supabase Auth Adapter
 * Centralizes all Supabase Auth admin operations to follow DIP.
 * Services should inject this adapter instead of using supabase directly.
 */

import { injectable } from 'tsyringe';
import { supabase } from '@/shared/supabase.js';
import {
    EmailNotVerifiedError,
    InvalidCredentialsError,
} from '@/shared/errors.js';

export interface AuthUser {
    id: string;
    email: string;
}

export interface CreateAuthUserOptions {
    email: string;
    password: string;
    emailConfirm?: boolean;
}

@injectable()
export class SupabaseAuthAdapter {
    /**
     * Create a new user in Supabase Auth.
     * @throws Error if creation fails
     */
    async createUser(options: CreateAuthUserOptions): Promise<AuthUser> {
        const { data, error } = await supabase.auth.admin.createUser({
            email: options.email,
            password: options.password,
            email_confirm: options.emailConfirm ?? true,
        });

        if (error || !data.user) {
            throw new Error(`Failed to create auth user: ${error?.message ?? 'Unknown error'}`);
        }

        return {
            id: data.user.id,
            email: data.user.email ?? options.email,
        };
    }

    /**
     * Delete a user from Supabase Auth.
     * Silently returns if user doesn't exist.
     */
    async deleteUser(supabaseUserId: string): Promise<void> {
        const { error } = await supabase.auth.admin.deleteUser(supabaseUserId);

        if (error) {
            // Log but don't throw - deletion should be idempotent
            console.error('Failed to delete user from Supabase Auth:', error);
        }
    }

    /**
     * Update a user's email in Supabase Auth.
     * @throws Error if update fails
     */
    async updateUserEmail(supabaseUserId: string, newEmail: string): Promise<void> {
        const { error } = await supabase.auth.admin.updateUserById(supabaseUserId, {
            email: newEmail,
            email_confirm: true,
        });

        if (error) {
            throw new Error(`Failed to update auth email: ${error.message}`);
        }
    }

    /**
     * Sign in a user and return the session.
     * Used for re-authentication before sensitive operations.
     */
    async signInWithPassword(email: string, password: string): Promise<{ accessToken: string; user: AuthUser | null }> {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            if (error.message.toLowerCase().includes('email not confirmed')) {
                throw new EmailNotVerifiedError();
            }
            throw new InvalidCredentialsError();
        }

        if (!data.session || !data.user) {
            throw new InvalidCredentialsError();
        }

        return {
            accessToken: data.session.access_token,
            user: {
                id: data.user.id,
                email: data.user.email ?? email
            }
        };
    }

    /**
     * Sign up a new user publicy (for self-registration).
     */
    async signUp(email: string, password: string, data: object): Promise<{ user: AuthUser | null; token: string | null }> {
        const { data: result, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data },
        });

        if (error) {
            throw new Error(error.message);
        }

        return {
            user: result.user ? { id: result.user.id, email: result.user.email ?? email } : null,
            token: result.session?.access_token ?? null,
        };
    }

    /**
     * Get user by token.
     */
    async getUser(token: string): Promise<AuthUser | null> {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return null;
        }

        return {
            id: user.id,
            email: user.email ?? '',
        };
    }

    /**
     * Send password reset email.
     */
    async resetPasswordForEmail(email: string, redirectTo: string): Promise<void> {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
        });

        if (error) {
            throw new Error(error.message);
        }
    }
}
