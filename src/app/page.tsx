import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, School, BookOpen, Trophy, MessageSquare, Calendar, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 sticky top-0 bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/60 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#854cf4] flex items-center justify-center shadow-inner">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold font-poppins">OrbitConnect</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#for-students" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                For Students
              </Link>
              <Link href="#for-teachers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                For Teachers
              </Link>
              <Link href="#for-schools" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                For Schools
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button 
                  size="sm"
                  className="bg-[#854cf4] hover:bg-[#7743e0] text-white shadow-lg shadow-[#854cf4]/20"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-purple-950/20 dark:via-background dark:to-blue-950/20" />
        <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-[#854cf4]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight font-poppins mb-6">
              <span className="bg-gradient-to-br from-[#854cf4] via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                Connect. Learn. Grow Together.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              A modern social learning platform that brings students, teachers, and schools together in one collaborative space.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup?role=student">
                <Button 
                  size="lg"
                  className="bg-[#854cf4] hover:bg-[#7743e0] text-white w-full sm:w-auto shadow-xl shadow-[#854cf4]/25"
                >
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Join as Student
                </Button>
              </Link>
              <Link href="/signup?role=teacher">
                <Button 
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto hover:shadow-lg hover:-translate-y-0.5 transition will-change-transform"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Join as Teacher
                </Button>
              </Link>
              <Link href="/signup?role=school">
                <Button 
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto hover:shadow-lg hover:-translate-y-0.5 transition will-change-transform"
                >
                  <School className="w-5 h-5 mr-2" />
                  Join as School
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mt-16 relative">
            <div className="relative aspect-video rounded-2xl border border-border/70 bg-muted overflow-hidden shadow-2xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#854cf4]/10 via-transparent to-blue-500/10" />
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=675&fit=crop" 
                alt="Students collaborating"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-poppins mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From sharing knowledge to organizing events, OrbitConnect provides all the tools for a thriving learning community.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
      <section id="for-students" className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold font-poppins mb-6">
                For Students
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Build your learning network, access quality resources, and collaborate with peers from around the world.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#854cf4]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#854cf4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Connect with peers</h3>
                    <p className="text-sm text-muted-foreground">Form study groups and collaborate on projects</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#854cf4]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#854cf4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Access study materials</h3>
                    <p className="text-sm text-muted-foreground">Find shared notes, resources, and practice materials</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#854cf4]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#854cf4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Get mentored</h3>
                    <p className="text-sm text-muted-foreground">Connect with experienced mentors and tutors</p>
                  </div>
                </li>
              </ul>
              <Link href="/signup?role=student" className="inline-block mt-8">
                <Button className="bg-[#854cf4] hover:bg-[#7743e0] text-white shadow-lg shadow-[#854cf4]/25">
                  Get Started as Student
                </Button>
              </Link>
            </div>
            <div className="relative h-96 lg:h-full">
              <div className="aspect-square rounded-2xl border border-border bg-muted overflow-hidden shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=800&h=800&fit=crop" 
                  alt="Students learning"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Teachers Section */}
      <section id="for-teachers" className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold font-poppins mb-6">
                For Teachers
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Create engaging content, manage classrooms, and connect with students and other educators.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#854cf4]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#854cf4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Create content</h3>
                    <p className="text-sm text-muted-foreground">Design lessons, quizzes, and interactive materials</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#854cf4]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#854cf4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Manage classrooms</h3>
                    <p className="text-sm text-muted-foreground">Organize students, track progress, and assign work</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#854cf4]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#854cf4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Connect with students</h3>
                    <p className="text-sm text-muted-foreground">Communicate, provide feedback, and build relationships</p>
                  </div>
                </li>
              </ul>
              <Link href="/signup?role=teacher" className="inline-block mt-8">
                <Button className="bg-[#854cf4] hover:bg-[#7743e0] text-white shadow-lg shadow-[#854cf4]/25">
                  Get Started as Teacher
                </Button>
              </Link>
            </div>
            <div className="relative h-96 lg:h-full">
              <div className="aspect-square rounded-2xl border border-border bg-muted overflow-hidden shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=800&h=800&fit=crop" 
                  alt="Teachers teaching"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Schools Section */}
      <section id="for-schools" className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold font-poppins mb-6">
                For Schools
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Empower your school community, showcase programs, and connect with parents and students.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#854cf4]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#854cf4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Showcase programs</h3>
                    <p className="text-sm text-muted-foreground">Highlight school initiatives, events, and achievements</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#854cf4]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#854cf4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Connect with parents</h3>
                    <p className="text-sm text-muted-foreground">Share updates, communicate events, and build relationships</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#854cf4]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#854cf4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Manage school events</h3>
                    <p className="text-sm text-muted-foreground">Organize school activities, competitions, and celebrations</p>
                  </div>
                </li>
              </ul>
              <Link href="/signup?role=school" className="inline-block mt-8">
                <Button className="bg-[#854cf4] hover:bg-[#7743e0] text-white shadow-lg shadow-[#854cf4]/25">
                  Get Started as School
                </Button>
              </Link>
            </div>
            <div className="relative h-96 lg:h-full">
              <div className="aspect-square rounded-2xl border border-border bg-muted overflow-hidden shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=800&h=800&fit=crop" 
                  alt="Schools community"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-12 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#854cf4] flex items-center justify-center shadow-inner">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold font-poppins">OrbitConnect</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Building the future of social learning.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Community</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/60 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 OrbitConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group p-6 rounded-2xl border border-border/60 bg-card/90 backdrop-blur-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#854cf4]/15 to-blue-500/15 flex items-center justify-center text-[#854cf4] mb-4 group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}