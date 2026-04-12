import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export function PageHeader({ title, subtitle, onBack }: PageHeaderProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg text-light/70 hover:bg-teal/10 hover:text-teal transition-colors focus:outline-none focus:ring-2 focus:ring-teal"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-2xl font-bold font-heading">{title}</h1>
      </div>
      {subtitle && <p className="text-sm text-gray-400 font-body mt-1">{subtitle}</p>}
    </div>
  );
}
