import { ChipScroller } from './ChipScroller';

interface Source {
  name: string;
  url?: string;
  isLlmGenerated?: boolean;
}

export interface SourceCitationRowProps {
  sources: Source[];
}

const SOURCE_COLORS: Record<string, string> = {
  Bhavaprakash: 'bg-amber-600/20 text-amber-400',
  Kastner: 'bg-blue-600/20 text-blue-400',
  USDA: 'bg-green-600/20 text-green-400',
  Amidha: 'bg-purple-600/20 text-purple-400',
};

const LLM_STYLE = 'bg-dark-border text-white/40';

export function SourceCitationRow({ sources }: SourceCitationRowProps) {
  return (
    <ChipScroller>
      {sources.map((source) => {
        const style = source.isLlmGenerated
          ? LLM_STYLE
          : (SOURCE_COLORS[source.name] ?? 'bg-dark-surface text-white/60');

        const content = (
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium">{source.name}</span>
            {source.isLlmGenerated && <span className="text-[10px] opacity-60">pending</span>}
          </div>
        );

        if (source.url) {
          return (
            <li key={source.name} className="list-none">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${style} px-3 py-1.5 rounded-full snap-start shrink-0 hover:opacity-80 transition-opacity inline-block`}
              >
                {content}
              </a>
            </li>
          );
        }

        return (
          <li
            key={source.name}
            className={`${style} px-3 py-1.5 rounded-full snap-start shrink-0 list-none`}
          >
            {content}
          </li>
        );
      })}
    </ChipScroller>
  );
}
