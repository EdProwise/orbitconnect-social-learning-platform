'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Loader2 } from 'lucide-react';
import { authApi, ApiError } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.login(formData);
      
      // Store token and user in localStorage for iframe compatibility
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      router.push('/feed');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-gradient-to-br from-[#D4AF37]/20 via-[#854cf4]/10 to-transparent blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-[#854cf4]/20 via-[#9f6fff]/10 to-transparent blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] via-[#854cf4] to-[#B8941F] flex items-center justify-center luxury-shadow-lg group-hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-[2px] rounded-[16px] bg-[#854cf4] flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>
            <span className="text-2xl font-bold font-poppins bg-gradient-to-r from-foreground via-[#854cf4] to-foreground bg-clip-text text-transparent">OrbitConnect</span>
          </Link>

          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold font-poppins mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-lg">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl glass-effect border-2 border-destructive/30 text-destructive text-sm luxury-shadow" role="alert">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
                className="h-12 rounded-2xl glass-effect border-border/40 focus:border-[#D4AF37]/30 transition-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-[#D4AF37] hover:text-[#854cf4] transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
                className="h-12 rounded-2xl glass-effect border-border/40 focus:border-[#D4AF37]/30 transition-all"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 relative bg-gradient-to-r from-[#854cf4] via-[#9f6fff] to-[#854cf4] bg-[length:200%_100%] hover:bg-right text-white font-semibold luxury-shadow-lg hover:scale-[1.02] transition-all duration-300 overflow-hidden group rounded-2xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin relative z-10" />
                  <span className="relative z-10">Signing in...</span>
                </>
              ) : (
                <span className="relative z-10">Sign in</span>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 via-transparent to-[#D4AF37]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="text-[#D4AF37] hover:text-[#854cf4] transition-colors font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block flex-1 relative bg-muted overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#854cf4]/95 via-[#9f6fff]/90 to-[#D4AF37]/80" />
        <img
          src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=1200&fit=crop"
          alt="Students collaborating"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md text-white space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold font-poppins leading-tight">
                Welcome back to <span className="luxury-text-gradient text-white">OrbitConnect</span>
              </h2>
              <p className="text-xl opacity-90 leading-relaxed">
                Continue your learning journey and connect with your community.
              </p>
            </div>
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4 glass-effect p-4 rounded-2xl border border-white/20 luxury-shadow">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
                <p className="text-sm font-medium">Access your personalized dashboard</p>
              </div>
              <div className="flex items-center gap-4 glass-effect p-4 rounded-2xl border border-white/20 luxury-shadow">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
                <p className="text-sm font-medium">Connect with your learning network</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}