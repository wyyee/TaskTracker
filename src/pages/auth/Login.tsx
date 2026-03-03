import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabase';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const { session } = useAuth();

    // If already logged in, redirect to dashboard
    if (session) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen bg-surface-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <img src="/Logo.png" alt="TaskTracker Logo" className="w-12 h-12 object-contain" />
                </div>
                <h2 className="mt-4 text-center text-3xl font-extrabold text-surface-900 tracking-tight">
                    Sign in to TaskTracker
                </h2>
                <p className="mt-2 text-center text-sm text-surface-600">
                    Manage your tasks, habits, and time all in one place.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-sm border border-surface-200 sm:rounded-xl sm:px-10">
                    <Auth
                        supabaseClient={supabase}
                        appearance={{
                            theme: ThemeSupa,
                            variables: {
                                default: {
                                    colors: {
                                        brand: '#14b8a6', // primary-500
                                        brandAccent: '#0d9488', // primary-600
                                    },
                                },
                            },
                            className: {
                                button: 'font-medium rounded-lg',
                                input: 'rounded-lg border-surface-300 focus:border-primary-500 focus:ring-primary-500',
                            }
                        }}
                        providers={[]} // Add 'google', 'github' etc. later if needed
                        redirectTo={window.location.origin + '/dashboard'}
                    />
                </div>
            </div>
        </div>
    );
}
