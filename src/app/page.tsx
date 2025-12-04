import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, School, BookOpen, Trophy, MessageSquare, Calendar, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 sticky top-0 glass-effect z-50 luxury-shadow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37] via-[#854cf4] to-[#B8941F] flex items-center justify-center luxury-shadow-lg group-hover:scale-105 transition-transform duration-300">
                <div className="absolute inset-[2px] rounded-[14px] bg-[#854cf4] flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold font-poppins bg-gradient-to-r from-foreground via-[#854cf4] to-foreground bg-clip-text text-transparent">
                OrbitConnect
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-10">
              <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 relative group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#854cf4] group-hover:w-full transition-all duration-300" />
              </Link>
              <Link href="#for-students" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 relative group">
                For Students
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#854cf4] group-hover:w-full transition-all duration-300" />
              </Link>
              <Link href="#for-teachers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 relative group">
                For Teachers
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#854cf4] group-hover:w-full transition-all duration-300" />
              </Link>
              <Link href="#for-schools" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 relative group">
                For Schools
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#854cf4] group-hover:w-full transition-all duration-300" />
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-medium hover:scale-105 transition-transform">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button 
                  size="sm"
                  className="relative bg-gradient-to-r from-[#854cf4] via-[#9f6fff] to-[#854cf4] bg-[length:200%_100%] hover:bg-right text-white font-medium luxury-shadow-lg hover:scale-105 transition-all duration-300 overflow-hidden group"
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 via-transparent to-[#D4AF37]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-40">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 via-white to-amber-50/60 dark:from-purple-950/10 dark:via-background dark:to-amber-950/10" />
        <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-gradient-to-br from-[#D4AF37]/30 via-[#854cf4]/20 to-transparent blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-[#854cf4]/30 via-blue-500/20 to-[#D4AF37]/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect luxury-shadow mb-8 border border-[#D4AF37]/20">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#854cf4] animate-pulse" />
              <span className="text-sm font-medium bg-gradient-to-r from-[#D4AF37] via-[#854cf4] to-[#D4AF37] bg-clip-text text-transparent">
                Premium Social Learning Platform
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight font-poppins mb-8 leading-[1.1]">
              <span className="luxury-text-gradient">
                Connect. Learn. Grow Together.
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              A modern social learning platform that brings students, teachers, and schools together in one 
              <span className="text-[#D4AF37] font-medium"> collaborative space</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link href="/signup?role=student">
                <Button 
                  size="lg"
                  className="relative bg-gradient-to-r from-[#854cf4] via-[#9f6fff] to-[#854cf4] bg-[length:200%_100%] hover:bg-right text-white w-full sm:w-auto luxury-shadow-lg hover:scale-105 transition-all duration-300 h-14 px-8 text-base font-semibold overflow-hidden group"
                >
                  <GraduationCap className="w-5 h-5 mr-2 relative z-10" />
                  <span className="relative z-10">Join as Student</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 via-transparent to-[#D4AF37]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
              </Link>
              <Link href="/signup?role=teacher">
                <Button 
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto glass-effect luxury-shadow hover:scale-105 transition-all duration-300 h-14 px-8 text-base font-semibold border-2 hover:border-[#D4AF37]/50 group"
                >
                  <Users className="w-5 h-5 mr-2 group-hover:text-[#D4AF37] transition-colors" />
                  Join as Teacher
                </Button>
              </Link>
              <Link href="/signup?role=school">
                <Button 
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto glass-effect luxury-shadow hover:scale-105 transition-all duration-300 h-14 px-8 text-base font-semibold border-2 hover:border-[#D4AF37]/50 group"
                >
                  <School className="w-5 h-5 mr-2 group-hover:text-[#D4AF37] transition-colors" />
                  Join as School
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mt-20 relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#D4AF37]/20 via-[#854cf4]/20 to-[#D4AF37]/20 rounded-3xl blur-2xl" />
            <div className="relative aspect-video rounded-3xl border-2 border-white/60 dark:border-white/10 bg-muted overflow-hidden luxury-shadow-lg">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/5 via-transparent to-[#854cf4]/5" />
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=675&fit=crop" 
                alt="Students collaborating"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-40 bg-gradient-to-b from-muted/30 via-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect luxury-shadow mb-6 border border-[#D4AF37]/20">
              <span className="text-sm font-medium text-[#D4AF37]">Features</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold font-poppins mb-6">
              Everything you need to <span className="luxury-text-gradient">succeed</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              From sharing knowledge to organizing events, OrbitConnect provides all the tools for a thriving learning community.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<BookOpen className="w-6 h-6" />}
              title="Rich Content Sharing"
              description="Share articles, photos, videos, study materials, and more with your learning community."
            />
            <FeatureCard
              icon={<MessageSquare className="w-6 h-6" />}
              title="Real-time Messaging"
              description="Connect instantly with peers, teachers, and mentors through our built-in messaging system."
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6" />}
              title="Event Management"
              description="Create and join quizzes, webinars, debates, and other educational events."
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Progress Tracking"
              description="Monitor your learning journey with course enrollments and completion tracking."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Mentorship"
              description="Connect with experienced mentors and tutors to accelerate your learning."
            />
            <FeatureCard
              icon={<Trophy className="w-6 h-6" />}
              title="Celebrate Achievements"
              description="Share your wins and celebrate milestones with the community."
            />
            <FeatureCard
              icon={<School className="w-6 h-6" />}
              title="School Pages"
              description="Schools can showcase programs, events, and connect with students and parents."
            />
            <FeatureCard
              icon={<GraduationCap className="w-6 h-6" />}
              title="Course Marketplace"
              description="Browse and enroll in courses across various subjects and skill levels."
            />
          </div>
        </div>
      </section>

      {/* For Students Section */}
      <section id="for-students" className="py-24 sm:py-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect luxury-shadow mb-6 border border-[#D4AF37]/20">
                <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm font-medium text-[#D4AF37]">For Students</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold font-poppins mb-6 leading-tight">
                Build your <span className="luxury-text-gradient">learning network</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                Access quality resources and collaborate with peers from around the world.
              </p>
              <ul className="space-y-6 mb-10">
                <li className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 via-[#854cf4]/20 to-transparent flex items-center justify-center flex-shrink-0 mt-0.5 luxury-shadow group-hover:scale-110 transition-transform duration-300">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#854cf4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Connect with peers</h3>
                    <p className="text-muted-foreground leading-relaxed">Form study groups and collaborate on projects</p>
                  </div>
                </li>
                <li className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 via-[#854cf4]/20 to-transparent flex items-center justify-center flex-shrink-0 mt-0.5 luxury-shadow group-hover:scale-110 transition-transform duration-300">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#854cf4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Access study materials</h3>
                    <p className="text-muted-foreground leading-relaxed">Find shared notes, resources, and practice materials</p>
                  </div>
                </li>
                <li className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 via-[#854cf4]/20 to-transparent flex items-center justify-center flex-shrink-0 mt-0.5 luxury-shadow group-hover:scale-110 transition-transform duration-300">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#854cf4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Get mentored</h3>
                    <p className="text-muted-foreground leading-relaxed">Connect with experienced mentors and tutors</p>
                  </div>
                </li>
              </ul>
              <Link href="/signup?role=student" className="inline-block">
                <Button className="relative bg-gradient-to-r from-[#854cf4] via-[#9f6fff] to-[#854cf4] bg-[length:200%_100%] hover:bg-right text-white luxury-shadow-lg hover:scale-105 transition-all duration-300 h-12 px-8 text-base font-semibold overflow-hidden group">
                  <span className="relative z-10">Get Started as Student</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 via-transparent to-[#D4AF37]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
              </Link>
            </div>
            <div className="relative h-[600px] lg:h-full">
              <div className="absolute -inset-4 bg-gradient-to-br from-[#D4AF37]/20 via-[#854cf4]/20 to-transparent rounded-3xl blur-2xl" />
              <div className="relative h-full aspect-square rounded-3xl border-2 border-white/60 dark:border-white/10 bg-muted overflow-hidden luxury-shadow-lg">
                <img 
                  src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=800&h=800&fit=crop" 
                  alt="Students learning"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/10 via-transparent to-[#854cf4]/10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Teachers Section */}
      <section id="for-teachers" className="py-24 sm:py-40 bg-gradient-to-b from-muted/30 via-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative h-[600px] lg:h-full">
              <div className="absolute -inset-4 bg-gradient-to-br from-[#854cf4]/20 via-[#D4AF37]/20 to-transparent rounded-3xl blur-2xl" />
              <div className="relative h-full aspect-square rounded-3xl border-2 border-white/60 dark:border-white/10 bg-muted overflow-hidden luxury-shadow-lg">
                <img 
                  src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=800&h=800&fit=crop" 
                  alt="Teachers teaching"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tl from-[#854cf4]/10 via-transparent to-[#D4AF37]/10" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect luxury-shadow mb-6 border border-[#D4AF37]/20">
                <Users className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm font-medium text-[#D4AF37]">For Teachers</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold font-poppins mb-6 leading-tight">
                Inspire the next <span className="luxury-text-gradient">generation</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                Create engaging content, manage classrooms, and connect with students and other educators.
              </p>
              <ul className="space-y-6 mb-10">
                <li className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#854cf4]/20 via-[#D4AF37]/20 to-transparent flex items-center justify-center flex-shrink-0 mt-0.5 luxury-shadow group-hover:scale-110 transition-transform duration-300">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#854cf4] to-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Create content</h3>
                    <p className="text-muted-foreground leading-relaxed">Design lessons, quizzes, and interactive materials</p>
                  </div>
                </li>
                <li className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#854cf4]/20 via-[#D4AF37]/20 to-transparent flex items-center justify-center flex-shrink-0 mt-0.5 luxury-shadow group-hover:scale-110 transition-transform duration-300">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#854cf4] to-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Manage classrooms</h3>
                    <p className="text-muted-foreground leading-relaxed">Organize students, track progress, and assign work</p>
                  </div>
                </li>
                <li className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#854cf4]/20 via-[#D4AF37]/20 to-transparent flex items-center justify-center flex-shrink-0 mt-0.5 luxury-shadow group-hover:scale-110 transition-transform duration-300">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#854cf4] to-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Connect with students</h3>
                    <p className="text-muted-foreground leading-relaxed">Communicate, provide feedback, and build relationships</p>
                  </div>
                </li>
              </ul>
              <Link href="/signup?role=teacher" className="inline-block">
                <Button className="relative bg-gradient-to-r from-[#854cf4] via-[#9f6fff] to-[#854cf4] bg-[length:200%_100%] hover:bg-right text-white luxury-shadow-lg hover:scale-105 transition-all duration-300 h-12 px-8 text-base font-semibold overflow-hidden group">
                  <span className="relative z-10">Get Started as Teacher</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 via-transparent to-[#D4AF37]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* For Schools Section */}
      <section id="for-schools" className="py-24 sm:py-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect luxury-shadow mb-6 border border-[#D4AF37]/20">
                <School className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm font-medium text-[#D4AF37]">For Schools</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold font-poppins mb-6 leading-tight">
                Empower your <span className="luxury-text-gradient">community</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                Showcase programs and connect with parents and students in meaningful ways.
              </p>
              <ul className="space-y-6 mb-10">
                <li className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 via-[#854cf4]/20 to-transparent flex items-center justify-center flex-shrink-0 mt-0.5 luxury-shadow group-hover:scale-110 transition-transform duration-300">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#854cf4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Showcase programs</h3>
                    <p className="text-muted-foreground leading-relaxed">Highlight school initiatives, events, and achievements</p>
                  </div>
                </li>
                <li className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 via-[#854cf4]/20 to-transparent flex items-center justify-center flex-shrink-0 mt-0.5 luxury-shadow group-hover:scale-110 transition-transform duration-300">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#854cf4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Connect with parents</h3>
                    <p className="text-muted-foreground leading-relaxed">Share updates, communicate events, and build relationships</p>
                  </div>
                </li>
                <li className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 via-[#854cf4]/20 to-transparent flex items-center justify-center flex-shrink-0 mt-0.5 luxury-shadow group-hover:scale-110 transition-transform duration-300">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#854cf4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Manage school events</h3>
                    <p className="text-muted-foreground leading-relaxed">Organize school activities, competitions, and celebrations</p>
                  </div>
                </li>
              </ul>
              <Link href="/signup?role=school" className="inline-block">
                <Button className="relative bg-gradient-to-r from-[#854cf4] via-[#9f6fff] to-[#854cf4] bg-[length:200%_100%] hover:bg-right text-white luxury-shadow-lg hover:scale-105 transition-all duration-300 h-12 px-8 text-base font-semibold overflow-hidden group">
                  <span className="relative z-10">Get Started as School</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 via-transparent to-[#D4AF37]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Button>
              </Link>
            </div>
            <div className="relative h-[600px] lg:h-full">
              <div className="absolute -inset-4 bg-gradient-to-br from-[#D4AF37]/20 via-[#854cf4]/20 to-transparent rounded-3xl blur-2xl" />
              <div className="relative h-full aspect-square rounded-3xl border-2 border-white/60 dark:border-white/10 bg-muted overflow-hidden luxury-shadow-lg">
                <img 
                  src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=800&h=800&fit=crop" 
                  alt="Schools community"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/10 via-transparent to-[#854cf4]/10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-16 glass-effect luxury-shadow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37] via-[#854cf4] to-[#B8941F] flex items-center justify-center luxury-shadow-lg">
                  <div className="absolute inset-[2px] rounded-[14px] bg-[#854cf4] flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="text-xl font-bold font-poppins">OrbitConnect</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Building the future of social learning.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-lg">Product</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-[#D4AF37] transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-[#D4AF37] transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-[#D4AF37] transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-lg">Company</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-[#D4AF37] transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-[#D4AF37] transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-[#D4AF37] transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-lg">Resources</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-[#D4AF37] transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-[#D4AF37] transition-colors">Community</Link></li>
                <li><Link href="#" className="hover:text-[#D4AF37] transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/40 text-center">
            <p className="text-sm text-muted-foreground">
              &copy; 2024 <span className="text-[#D4AF37] font-medium">OrbitConnect</span>. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group relative p-8 rounded-3xl border border-border/40 glass-effect hover:border-[#D4AF37]/30 luxury-shadow hover:luxury-shadow-lg hover:-translate-y-2 transition-all duration-500">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#D4AF37]/0 via-[#854cf4]/0 to-[#D4AF37]/0 group-hover:from-[#D4AF37]/5 group-hover:via-[#854cf4]/5 group-hover:to-[#D4AF37]/5 transition-all duration-500" />
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37]/15 via-[#854cf4]/15 to-transparent flex items-center justify-center text-[#854cf4] mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 luxury-shadow">
          {icon}
        </div>
        <h3 className="font-semibold text-lg mb-3">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}