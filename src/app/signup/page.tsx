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
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-[#854cf4] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold font-poppins">OrbitConnect</span>
          </Link>

          {step === 1 ? (
            // Step 1: Role Selection
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold font-poppins mb-2">Get started</h1>
                <p className="text-muted-foreground">Choose your role to continue</p>
              </div>

              <div className="space-y-3">
                {(Object.keys(roleConfig) as Array<keyof typeof roleConfig>).map((role) => {
                  const RoleIcon = roleConfig[role].icon;
                  return (
                    <button
                      key={role}
                      onClick={() => handleRoleSelect(role)}
                      className="w-full p-4 rounded-xl border-2 border-border hover:border-[#854cf4] hover:bg-[#854cf4]/5 transition-all text-left group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#854cf4]/10 group-hover:bg-[#854cf4]/20 flex items-center justify-center text-[#854cf4] flex-shrink-0 transition-colors">
                          <RoleIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{roleConfig[role].title}</h3>
                          <p className="text-sm text-muted-foreground">
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
                <Link href="/login" className="text-[#854cf4] hover:underline font-medium">
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
                  className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
                >
                  ← Change role
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-[#854cf4]/10 flex items-center justify-center text-[#854cf4]">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold font-poppins">{config.title}</h1>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm" role="alert">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>

                {(selectedRole === 'student' || selectedRole === 'teacher') && (
                  <div className="space-y-2">
                    <Label htmlFor="schoolId">School (Optional)</Label>
                    <Select 
                      value={formData.schoolId} 
                      onValueChange={(value) => setFormData({ ...formData, schoolId: value })}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select your school" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Greenwood Academy</SelectItem>
                        <SelectItem value="2">Riverside High School</SelectItem>
                        <SelectItem value="3">Summit International School</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={isLoading}
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#854cf4] hover:bg-[#7743e0] text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create account'
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-[#854cf4] hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block flex-1 relative bg-muted">
        <div className="absolute inset-0 bg-gradient-to-br from-[#854cf4]/90 to-[#6b3cc9]/90" />
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&fit=crop"
          alt="Students learning"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
        />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md text-white">
            <h2 className="text-4xl font-bold font-poppins mb-4">
              Join the OrbitConnect community
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Connect with thousands of students, teachers, and schools worldwide.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span>Build your learning network</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span>Access quality resources</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span>Collaborate and grow together</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}