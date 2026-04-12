/**
 * UploadDropZone -- drag-and-drop file selector for lab reports.
 * Accepts PDF, JPEG, and PNG files. Rejects HEIC with a user-facing message.
 */

import { useCallback, useRef, useState } from 'react';

interface UploadDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

function isHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    file.type === 'image/heic' ||
    file.type === 'image/heif'
  );
}

export function UploadDropZone({ onFilesSelected, disabled }: UploadDropZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndAdd = useCallback(
    (fileList: FileList | File[]) => {
      setError(null);
      const files = Array.from(fileList);
      const valid: File[] = [];

      for (const file of files) {
        if (isHeic(file)) {
          setError(
            "HEIC format is not supported. Please use your camera's Most Compatible setting or convert to JPEG.",
          );
          continue;
        }
        if (!ACCEPTED_TYPES.has(file.type)) {
          setError('Only PDF, JPEG, and PNG files are accepted.');
          continue;
        }
        valid.push(file);
      }

      if (valid.length > 0) {
        onFilesSelected(valid);
      }
    },
    [onFilesSelected],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (disabled) return;
      validateAndAdd(e.dataTransfer.files);
    },
    [disabled, validateAndAdd],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setDragActive(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) validateAndAdd(e.target.files);
      // Reset so the same file can be re-selected
      e.target.value = '';
    },
    [validateAndAdd],
  );

  return (
    <div className="space-y-2">
      <button
        type="button"
        className={`
          relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl w-full
          border-2 border-dashed cursor-pointer transition-all bg-transparent
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${
            dragActive
              ? 'border-teal-500 bg-teal-500/5'
              : 'border-teal-500/30 dark:border-teal-500/30 hover:border-teal-500/50'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        disabled={disabled}
        aria-label="Drop your lab report here or click to select a file"
      >
        {/* Upload icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-12 h-12 text-teal-500/60"
          aria-hidden="true"
        >
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <path d="M12 18v-6" />
          <path d="m9 15 3-3 3 3" />
        </svg>

        <div className="text-center">
          <p className="text-lg font-medium text-light/80 dark:text-light/80">
            Drop your lab report here
          </p>
          <p className="text-sm text-light/40 dark:text-light/40 mt-1">or tap to select a file</p>
          <p className="text-xs text-light/30 dark:text-light/30 mt-2">
            PDF, JPEG, or PNG up to 20 MB
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          capture="environment"
          multiple
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />
      </button>

      {error && (
        <p className="text-sm text-red-400 px-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
