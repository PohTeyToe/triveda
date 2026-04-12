const CATEGORY_COLORS: Record<string, string> = {
  grains: 'bg-terracotta',
  vegetables: 'bg-sage',
  fruits: 'bg-green',
  spices: 'bg-teal',
  dairy: 'bg-light-muted',
  protein: 'bg-light-muted',
  'animal-protein': 'bg-light-muted',
};

const DEFAULT_COLOR = 'bg-dark-border';

interface GlyphFallbackProps {
  name: string;
  category: string;
  size: number;
}

export function GlyphFallback({ name, category, size }: GlyphFallbackProps) {
  const bgColor = CATEGORY_COLORS[category] ?? DEFAULT_COLOR;
  const letter = name.charAt(0).toUpperCase();
  const fontSize = size <= 48 ? 20 : Math.round(size * 0.4);

  return (
    <div
      aria-hidden="true"
      className={`${bgColor} rounded-full flex items-center justify-center shrink-0`}
      style={{ width: size, height: size }}
    >
      <span className="font-heading text-dark" style={{ fontSize }}>
        {letter}
      </span>
    </div>
  );
}
