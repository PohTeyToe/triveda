/**
 * BloodWorkUploadScreen -- upload flow with drop zone, file list,
 * privacy disclaimer, and job status strip.
 */

import { useCallback, useState } from 'react';
import { useBloodWorkUpload } from '../../hooks/useBloodWorkUpload';
import { FileList } from './FileList';
import { JobStatusStrip } from './JobStatusStrip';
import { PrivacyDisclaimer } from './PrivacyDisclaimer';
import { UploadDropZone } from './UploadDropZone';

type Phase = 'select' | 'uploading' | 'processing';

interface UploadJob {
  jobId: string;
  reportId: string;
  fileName: string;
}

export function BloodWorkUploadScreen() {
  const [files, setFiles] = useState<File[]>([]);
  const [phase, setPhase] = useState<Phase>('select');
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const uploadMutation = useBloodWorkUpload();

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setPhase('uploading');
    const completedJobs: UploadJob[] = [];

    for (const file of files) {
      setUploadProgress((prev) => ({ ...prev, [file.name]: 10 }));

      try {
        // Simulate gradual progress
        setUploadProgress((prev) => ({ ...prev, [file.name]: 50 }));

        const result = await uploadMutation.mutateAsync(file);
        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
        completedJobs.push({
          jobId: result.jobId,
          reportId: result.reportId,
          fileName: file.name,
        });
      } catch {
        setUploadProgress((prev) => ({ ...prev, [file.name]: -1 }));
      }
    }

    if (completedJobs.length > 0) {
      setJobs(completedJobs);
      setPhase('processing');
    }
  }, [files, uploadMutation]);

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-teal mb-1">Upload Lab Report</h1>
        <p className="text-sm text-light/40 dark:text-light/40">
          Upload your blood work results to get personalized food recommendations informed by three
          wellness traditions.
        </p>
      </div>

      {phase === 'select' && (
        <>
          <UploadDropZone onFilesSelected={handleFilesSelected} />

          <FileList files={files} onRemove={handleRemoveFile} uploadProgress={uploadProgress} />

          <PrivacyDisclaimer />

          {files.length > 0 && (
            <button
              type="button"
              onClick={handleUpload}
              className="w-full py-3 rounded-xl bg-teal-500 text-cream font-medium hover:bg-teal-600 transition-colors disabled:opacity-50"
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending
                ? 'Uploading...'
                : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
            </button>
          )}
        </>
      )}

      {phase === 'uploading' && (
        <div className="space-y-4">
          <FileList
            files={files}
            onRemove={handleRemoveFile}
            uploadProgress={uploadProgress}
            disabled
          />
          <p className="text-sm text-light/40 dark:text-light/40 text-center">Uploading files...</p>
        </div>
      )}

      {phase === 'processing' && (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobStatusStrip
              key={job.jobId}
              jobId={job.jobId}
              reportId={job.reportId}
              fileName={job.fileName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
