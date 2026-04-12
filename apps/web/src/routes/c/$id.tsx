/**
 * Public constitution view at /c/:id.
 *
 * Read-only view of a shared constitution card.
 * No auth required. Includes ShareButton and CTA to get your own.
 */

import { Link, createFileRoute } from '@tanstack/react-router';
import { Card } from '../../components/layout/Card';
import { ConstitutionSection } from '../../components/onboarding/ConstitutionSection';
import { PlainLanguageSummary } from '../../components/onboarding/PlainLanguageSummary';
import { ShareButton } from '../../components/share/ShareButton';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { usePublicConstitution } from '../../hooks/usePublicConstitution';

export const Route = createFileRoute('/c/$id')({
  component: PublicConstitutionView,
});

function PublicConstitutionView() {
  const { id } = Route.useParams();
  const { data, isLoading, isError, error } = usePublicConstitution(id);

  const title = data?.summary
    ? data.summary.length > 60
      ? `${data.summary.slice(0, 57)}...`
      : data.summary
    : '';
  useDocumentTitle(title);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg mx-auto" aria-busy="true">
        {/* Summary skeleton */}
        <Card variant="elevated" className="border-t-2 border-teal/30 p-4 md:p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-7 bg-gray-200 dark:bg-dark-border rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-dark-border rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-dark-border rounded w-5/6" />
          </div>
        </Card>
        {/* Tradition sections skeleton */}
        <Card variant="default" className="p-4 md:p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="h-5 bg-gray-200 dark:bg-dark-border rounded w-1/3" />
                <div className="h-5 w-5 bg-gray-200 dark:bg-dark-border rounded" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // Not found
  if (isError && error?.message === 'NOT_FOUND') {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4 py-12">
        <h2 className="font-heading text-2xl text-dark dark:text-light">
          This constitution could not be found
        </h2>
        <p className="font-body text-gray-600 dark:text-gray-400">
          It may have been removed or the link might be incorrect.
        </p>
        <Link
          to="/quick-start"
          className="inline-block mt-4 px-6 py-2.5 rounded-xl font-body text-sm
            bg-teal text-white hover:bg-teal/90 transition-colors
            focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
        >
          Get your own constitution
        </Link>
      </div>
    );
  }

  // Generic error
  if (isError || !data) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4 py-12">
        <h2 className="font-heading text-2xl text-dark dark:text-light">Something went wrong</h2>
        <p className="font-body text-gray-600 dark:text-gray-400">
          We could not load this constitution. Please try again later.
        </p>
        <Link
          to="/quick-start"
          className="inline-block mt-4 px-6 py-2.5 rounded-xl font-body text-sm
            bg-teal text-white hover:bg-teal/90 transition-colors
            focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
        >
          Get your own constitution
        </Link>
      </div>
    );
  }

  // Loaded
  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Share button */}
      <div className="flex justify-end">
        <ShareButton constitutionId={id} summary={data.summary} />
      </div>

      {/* Plain language summary */}
      <PlainLanguageSummary summary={data.summary} />

      {/* Tradition sections */}
      <Card variant="default" className="p-4 md:p-6">
        <ConstitutionSection
          title="Ayurveda"
          content={data.traditions.ayurveda}
          defaultExpanded={true}
          sectionId="section-ayurveda-public"
        />
        <ConstitutionSection
          title="TCM"
          content={data.traditions.tcm}
          defaultExpanded={false}
          sectionId="section-tcm-public"
        />
        <ConstitutionSection
          title="Naturopathy"
          content={data.traditions.naturopathy}
          defaultExpanded={false}
          sectionId="section-naturopathy-public"
        />
      </Card>

      {/* CTA */}
      <div className="text-center pt-2 pb-8">
        <Link
          to="/quick-start"
          className="inline-block px-6 py-2.5 rounded-xl font-body text-sm
            bg-teal text-white hover:bg-teal/90 transition-colors
            focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
        >
          Get your own constitution
        </Link>
        <p className="font-body text-xs text-gray-500 dark:text-gray-400 mt-2">Takes 15 seconds</p>
      </div>
    </div>
  );
}
