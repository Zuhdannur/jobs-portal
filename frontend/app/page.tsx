import Link from 'next/link';
import { Search, Briefcase, Building2, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  const stats = [
    { icon: Briefcase, label: 'Active Jobs', value: '1,000+' },
    { icon: Building2, label: 'Companies', value: '500+' },
    { icon: MapPin, label: 'Locations', value: '50+' },
  ];

  const platforms = [
    { name: 'LinkedIn', color: 'bg-[#0A66C2]' },
    { name: 'Indeed', color: 'bg-[#003A9B]' },
    { name: 'Y Combinator', color: 'bg-[#F26522]' },
    { name: 'Glints', color: 'bg-[#00C853]' },
    { name: 'JobStreet', color: 'bg-[#D93025]' },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/5 to-background py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Find Your Dream Job
            <br />
            <span className="text-primary">All in One Place</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            We aggregate job listings from LinkedIn, Indeed, Y Combinator, Glints, and JobStreet
            so you don&apos;t have to search multiple sites.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs, companies, or keywords..."
                  className="pl-10 h-12"
                />
              </div>
              <Link href="/jobs">
                <Button size="lg" className="h-12 px-8">
                  Search
                </Button>
              </Link>
            </div>
          </div>

          {/* Platform Badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-background border shadow-sm"
              >
                <div className={`h-2 w-2 rounded-full ${platform.color}`} />
                <span className="text-sm font-medium">{platform.name}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/jobs">
              <Button size="lg">Browse Jobs</Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline">Create Account</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="bg-background">
                <CardContent className="flex items-center gap-4 py-6">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose JobPortal?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We make job searching easier by aggregating listings from multiple platforms
              into one convenient location.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="py-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Unified Search</h3>
                <p className="text-muted-foreground">
                  Search across 5+ job platforms simultaneously. No more tab switching.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Save & Track</h3>
                <p className="text-muted-foreground">
                  Save interesting jobs and track your application status in one dashboard.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Smart Filters</h3>
                <p className="text-muted-foreground">
                  Filter by location, job type, experience level, and salary range.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Next Job?</h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Join thousands of job seekers who have found their dream job through JobPortal.
          </p>
          <Link href="/jobs">
            <Button size="lg" variant="secondary">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
