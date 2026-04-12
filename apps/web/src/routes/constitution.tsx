import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/constitution')({
  component: ConstitutionPage,
});

function ConstitutionPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="text-center p-8 rounded-2xl bg-dark-surface border border-dark-border max-w-md">
        <h1 className="font-heading text-2xl font-bold text-teal mb-2">Constitution Quiz</h1>
        <p className="text-light/40 text-sm">Constitution Quiz &mdash; Coming in split 04</p>
      </div>
    </div>
  );
}
