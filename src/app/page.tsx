import Link from 'next/link';
import {
  Zap,
  Upload,
  Brain,
  Send,
  MessageSquare,
  TrendingUp,
  Check,
  ArrowRight,
  Star,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ReActivate</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 text-brand-700 text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Trusted by 500+ agents reactivating dead leads
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight max-w-4xl mx-auto">
            Turn Your Dead Database Into{' '}
            <span className="text-brand-600">Active Leads</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your dormant CRM contacts. Our AI segments them, writes personalized
            messages in your voice, and runs a 4-touch reactivation drip. Expect 5-10% of
            dead leads to come back to life.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3 text-base font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 flex items-center justify-center gap-2"
            >
              Start Reactivating
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
            >
              See How It Works
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            No credit card required. Upload up to 100 contacts free.
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-brand-600 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: '5-10%', label: 'Average Reactivation Rate' },
              { value: '47x', label: 'ROI on First Campaign' },
              { value: '<2min', label: 'Setup Time' },
              { value: '4-Touch', label: 'AI Drip Sequence' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-brand-200 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Three simple steps to bring your dead database back to life
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: Upload,
                title: 'Upload Your CSV',
                description:
                  'Export contacts from your CRM and upload the CSV. Our smart mapper recognizes fields from any major CRM.',
                step: '1',
              },
              {
                icon: Brain,
                title: 'AI Segments & Personalizes',
                description:
                  'Claude AI analyzes each contact — recency, source, notes — and crafts personalized messages in your brand voice.',
                step: '2',
              },
              {
                icon: Send,
                title: '4-Touch Drip Runs',
                description:
                  'Automated SMS and email sequence: Day 0 SMS, Day 7 email, Day 21 SMS, Day 45 email. Customizable timing.',
                step: '3',
              },
              {
                icon: MessageSquare,
                title: 'Replies Flow to You',
                description:
                  'When a contact replies with warm intent, the drip pauses and you get an instant alert. Time to close.',
                step: '4',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative text-center">
                  <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-brand-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 md:right-auto md:-top-2 md:-left-2 w-7 h-7 bg-brand-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Built for Real Estate Agents & SMBs
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'AI-Powered Segmentation',
                description:
                  'Contacts are automatically categorized: hot dormant, warm dormant, cold dormant, past clients, referral sources, and more.',
              },
              {
                icon: MessageSquare,
                title: 'Your Voice, Not a Bot',
                description:
                  'Set your brand voice once, and every message sounds like you wrote it. Personal, warm, never spammy.',
              },
              {
                icon: TrendingUp,
                title: 'Smart Reply Detection',
                description:
                  'AI classifies replies as warm, not-now, or opt-out. Warm replies pause the drip and alert you instantly.',
              },
              {
                icon: Send,
                title: 'Multi-Channel Drip',
                description:
                  'Alternating SMS and email touches cut through inbox noise. Customizable cadence for your market.',
              },
              {
                icon: Upload,
                title: 'Universal CRM Import',
                description:
                  'Smart field mapping works with exports from Follow Up Boss, KVCore, BoomTown, Salesforce, HubSpot, and any CSV.',
              },
              {
                icon: Zap,
                title: 'Set & Forget',
                description:
                  'Campaigns run automatically. You only step in when a lead is warm and ready to talk.',
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-brand-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose the plan that matches your database size
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '$297',
                description: 'Perfect for solo agents',
                contacts: 'Up to 1,000 contacts',
                features: [
                  '1 active campaign',
                  '4-touch drip sequence',
                  'AI segmentation',
                  'AI message personalization',
                  'SMS + Email delivery',
                  'Reply detection & alerts',
                  'Basic dashboard',
                ],
                cta: 'Start Free Trial',
                popular: false,
              },
              {
                name: 'Growth',
                price: '$497',
                description: 'For growing teams',
                contacts: 'Up to 5,000 contacts',
                features: [
                  '5 active campaigns',
                  'Custom cadence builder',
                  'AI segmentation',
                  'AI message personalization',
                  'SMS + Email delivery',
                  'Reply detection & alerts',
                  'Advanced analytics',
                  'Priority support',
                ],
                cta: 'Start Free Trial',
                popular: true,
              },
              {
                name: 'Enterprise',
                price: '$797',
                description: 'For brokerages & teams',
                contacts: 'Up to 25,000 contacts',
                features: [
                  'Unlimited campaigns',
                  'Custom cadence builder',
                  'AI segmentation',
                  'AI message personalization',
                  'SMS + Email delivery',
                  'Reply detection & alerts',
                  'Advanced analytics',
                  'Team management',
                  'API access',
                  'Dedicated support',
                ],
                cta: 'Contact Sales',
                popular: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 ${
                  plan.popular
                    ? 'border-brand-600 shadow-xl ring-1 ring-brand-600'
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <p className="text-sm font-medium text-brand-600 mt-2">{plan.contacts}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  className={`block w-full text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    plan.popular
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Your Dead Database Is Costing You Money
          </h2>
          <p className="text-lg text-brand-100 mb-8 max-w-2xl mx-auto">
            Every day those contacts sit idle, someone else is warming them up. Upload your
            CSV in 2 minutes and let AI do the rest.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-brand-600 font-medium rounded-lg hover:bg-brand-50 transition-colors"
          >
            Start Reactivating Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">ReActivate</span>
            </div>
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} ReActivate. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
