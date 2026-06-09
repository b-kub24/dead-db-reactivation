export function formatDate(date: string | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeDate(date: string | null): string {
  if (!date) return 'N/A';
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function calculateDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function calculateNextSendAt(
  startDate: Date,
  cadence: { day: number; channel: string }[],
  currentStep: number
): Date | null {
  if (currentStep >= cadence.length) return null;
  const nextStep = cadence[currentStep];
  return addDays(startDate, nextStep.day);
}

export function getSegmentColor(segment: string): string {
  const colors: Record<string, string> = {
    'hot-dormant': 'bg-red-100 text-red-800',
    'warm-dormant': 'bg-orange-100 text-orange-800',
    'cold-dormant': 'bg-blue-100 text-blue-800',
    'past-client': 'bg-purple-100 text-purple-800',
    'referral-source': 'bg-green-100 text-green-800',
    'sphere-of-influence': 'bg-pink-100 text-pink-800',
    'event-lead': 'bg-yellow-100 text-yellow-800',
    'online-lead': 'bg-indigo-100 text-indigo-800',
    'unknown': 'bg-gray-100 text-gray-800',
  };
  return colors[segment] || 'bg-gray-100 text-gray-800';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    active: 'bg-blue-100 text-blue-800',
    replied: 'bg-green-100 text-green-800',
    opted_out: 'bg-red-100 text-red-800',
    reactivated: 'bg-emerald-100 text-emerald-800',
    dead: 'bg-gray-100 text-gray-500',
    draft: 'bg-gray-100 text-gray-800',
    paused: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
