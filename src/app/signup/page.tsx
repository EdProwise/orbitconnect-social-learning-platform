'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Loader2, Users, School as SchoolIcon } from 'lucide-react';
import { authApi, ApiError } from '@/lib/api-client';

const roleConfig = {
  student: {
    icon: GraduationCap,
    title: 'Join as Student',
    description: 'Connect with peers, access resources, and accelerate your learning',
  },
  teacher: {
    icon: Users,
    title: 'Join as Teacher',
    description: 'Share your expertise, create courses, and mentor students',
  },
  school: {
    icon: SchoolIcon,
    title: 'Join as School',
    description: 'Showcase your institution and engage with your community',
  },
};

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role') || 'student';
  
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | 'school'>(
    roleParam as 'student' | 'teacher' | 'school'
  );
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    bio: '',
    schoolId: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const role = searchParams.get('role');
    if (role && ['student', 'teacher', 'school'].includes(role)) {
      setSelectedRole(role as 'student' | 'teacher' | 'school');
    }
  }, [searchParams]);

  const handleRoleSelect = (role: 'student' | 'teacher' | 'school') => {
    setSelectedRole(role);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const signupData: any = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: selectedRole.toUpperCase(),
      };

      if (formData.bio) {
        signupData.bio = formData.bio;
      }

      if (formData.schoolId) {
        signupData.schoolId = parseInt(formData.schoolId);
      }

      const response = await authApi.signup(signupData);
      
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

  const config = roleConfig[selectedRole];
  const Icon = config.icon;

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

          {step === 1 ? (
            // Step 1: Role Selection
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold font-poppins mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Get started</h1>
                <p className="text-muted-foreground text-lg">Choose your role to continue</p>
              </div>

              <div className="space-y-4">
                {(Object.keys(roleConfig) as Array<keyof typeof roleConfig>).map((role) => {
                  const RoleIcon = roleConfig[role].icon;
                  return (
                    <button
                      key={role}
                      onClick={() => handleRoleSelect(role)}
                      className="w-full p-6 rounded-2xl border-2 border-border/60 glass-effect hover:border-[#D4AF37]/50 luxury-shadow hover:luxury-shadow-lg hover:scale-[1.02] transition-all duration-300 text-left group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/0 via-[#854cf4]/0 to-[#D4AF37]/0 group-hover:from-[#D4AF37]/5 group-hover:via-[#854cf4]/5 group-hover:to-[#D4AF37]/5 transition-all duration-300" />
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37]/15 via-[#854cf4]/15 to-transparent flex items-center justify-center text-[#854cf4] flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 luxury-shadow">
                          <RoleIcon className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-2">{roleConfig[role].title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {roleConfig[role].description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-[#D4AF37] hover:text-[#854cf4] transition-colors font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          ) : (
            // Step 2: Registration Form
            <div className="space-y-6">
              <div>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-muted-foreground hover:text-[#D4AF37] mb-4 flex items-center gap-1 font-medium transition-colors"
                >
                  ← Change role
                </button>
                <div className="flex items-center gap-4 mb-2 p-4 rounded-2xl glass-effect border border-border/40 luxury-shadow">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37]/15 via-[#854cf4]/15 to-transparent flex items-center justify-center text-[#854cf4] luxury-shadow">
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold font-poppins">{config.title}</h1>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 rounded-2xl glass-effect border-2 border-destructive/30 text-destructive text-sm luxury-shadow" role="alert">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-12 rounded-2xl glass-effect border-border/40 focus:border-[#D4AF37]/30 transition-all"
                  />
                </div>

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
                  <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-12 rounded-2xl glass-effect border-border/40 focus:border-[#D4AF37]/30 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-12 rounded-2xl glass-effect border-border/40 focus:border-[#D4AF37]/30 transition-all"
                  />
                </div>

                {(selectedRole === 'student' || selectedRole === 'teacher') && (
                  <div className="space-y-2">
                    <Label htmlFor="schoolId" className="text-sm font-semibold">School (Optional)</Label>
                    <Select 
                      value={formData.schoolId} 
                      onValueChange={(value) => setFormData({ ...formData, schoolId: value })}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-12 rounded-2xl glass-effect border-border/40">
                        <SelectValue placeholder="Select your school" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl glass-effect border-border/40 luxury-shadow-lg">
                        <SelectItem value="1">Greenwood Academy</SelectItem>
                        <SelectItem value="2">Riverside High School</SelectItem>
                        <SelectItem value="3">Summit International School</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-semibold">Bio (Optional)</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={isLoading}
                    rows={3}
                    className="rounded-2xl glass-effect border-border/40 focus:border-[#D4AF37]/30 transition-all"
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
                      <span className="relative z-10">Creating account...</span>
                    </>
                  ) : (
                    <span className="relative z-10">Create account</span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 via-transparent to-[#D4AF37]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-[#D4AF37] hover:text-[#854cf4] transition-colors font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block flex-1 relative bg-muted overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#854cf4]/95 via-[#9f6fff]/90 to-[#D4AF37]/80" />
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&fit=crop"
          alt="Students learning"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md text-white space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold font-poppins leading-tight">
                Join the <span className="luxury-text-gradient text-white">OrbitConnect</span> community
              </h2>
              <p className="text-xl opacity-90 leading-relaxed">
                Connect with thousands of students, teachers, and schools worldwide.
              </p>
            </div>
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4 glass-effect p-4 rounded-2xl border border-white/20 luxury-shadow">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
                <p className="text-sm font-medium">Build your learning network</p>
              </div>
              <div className="flex items-center gap-4 glass-effect p-4 rounded-2xl border border-white/20 luxury-shadow">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
                <p className="text-sm font-medium">Access quality resources</p>
              </div>
              <div className="flex items-center gap-4 glass-effect p-4 rounded-2xl border border-white/20 luxury-shadow">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
                <p className="text-sm font-medium">Collaborate and grow together</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}