"use client";

import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

const Auth = () => {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#f8f9ff]">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-200/40 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-200/40 rounded-full blur-[150px] animate-pulse delay-700" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-sky-200/30 rounded-full blur-[120px]" />

      <Card className="w-full max-w-md border-none shadow-[0_40px_120px_rgba(79,70,229,0.15)] rounded-[3.5rem] bg-white/80 backdrop-blur-2xl relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500" />
        
        <CardHeader className="text-center pt-16 pb-10">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-200 rotate-3 hover:rotate-0 transition-transform duration-500">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-5xl font-black text-slate-900 tracking-tighter">StudyFlow</CardTitle>
        </CardHeader>

        <CardContent className="px-10 pb-16">
          <SupabaseAuth
            supabaseClient={supabase}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#4f46e5',
                    brandAccent: '#4338ca',
                    inputBackground: '#ffffff',
                    inputText: '#0f172a',
                    inputBorder: '#e2e8f0',
                    inputPlaceholder: '#94a3b8',
                  },
                  radii: {
                    buttonRadius: '1.25rem',
                    inputRadius: '1.25rem',
                    cardRadius: '3rem',
                  },
                },
              },
            }}
            theme="light"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;