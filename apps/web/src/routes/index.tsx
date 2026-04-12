import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="text-center p-8 rounded-2xl bg-dark-surface border border-dark-border max-w-md">
        <h1 className="font-heading text-3xl font-bold text-teal mb-2">Triveda</h1>
        <p className="text-light/60 font-body">Three-tradition daily food companion</p>
        <p className="text-light/40 text-sm mt-4">Home &mdash; Coming in split 03</p>
      </div>
    </div>
  );
}
