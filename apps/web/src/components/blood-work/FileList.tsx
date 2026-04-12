/**
 * FileList -- renders selected files with size, type icon, and remove button.
 * During upload, shows progress bars per file.
 */

interface FileListProps {
  files: File[];
  onRemove: (index: number) => void;
  uploadProgress: Record<string, number>;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncateFileName(name: string, maxLength = 30): string {
  if (name.length <= maxLength) return name;
  const ext = name.slice(name.lastIndexOf('.'));
  const base = name.slice(0, maxLength - ext.length - 3);
  return `${base}...${ext}`;
}

export function FileList({ files, onRemove, uploadProgress, disabled }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      {files.map((file, index) => {
        const progress = uploadProgress[file.name];
        const isUploading = progress != null && progress < 100;
        const isDone = progress === 100;
        const isPdf = file.type === 'application/pdf';

        return (
          <div
            key={`${file.name}-${index}`}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-dark-surface/50 dark:bg-dark-surface/50 border border-dark-border/20 dark:border-dark-border/20"
          >
            {/* File type icon */}
            <div className="shrink-0">
              {isPdf ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-red-400"
                  aria-hidden="true"
                >
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                  <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-blue-400"
                  aria-hidden="true"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-light/80 dark:text-light/80 truncate">
                {truncateFileName(file.name)}
              </p>
              <p className="text-xs text-light/40 dark:text-light/40">
                {formatFileSize(file.size)}
              </p>
            </div>

            {/* Progress or remove */}
            {isUploading ? (
              <div className="w-20 h-1.5 rounded-full bg-dark-border/30 dark:bg-dark-border/30 overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : isDone ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-emerald-400"
                role="img"
                aria-label="Upload complete"
              >
                <title>Upload complete</title>
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
                className="p-1 rounded hover:bg-dark-border/20 dark:hover:bg-dark-border/20 transition-colors"
                aria-label={`Remove ${file.name}`}
                disabled={disabled}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-light/40 hover:text-light/60"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
