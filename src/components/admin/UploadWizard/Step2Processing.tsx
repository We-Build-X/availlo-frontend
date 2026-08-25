import { CheckCircle, DangerTriangle, CloudUpload } from "@solar-icons/react";
import { Button } from "@/components/ui/button";

interface Step2ProcessingProps {
  isUploading: boolean;
  uploadError?: string;
  onRetry: () => void;
}

export function Step2Processing({ isUploading, uploadError, onRetry }: Step2ProcessingProps) {
  if (uploadError) {
    return (
      <div className="space-y-8 py-8">
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <DangerTriangle className="w-10 h-10 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Upload Failed</h2>
            <p className="text-slate-500 mt-2 text-sm max-w-md">{uploadError}</p>
          </div>
          <Button onClick={onRetry} variant="outline" size="lg" className="w-full sm:w-auto">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8">
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          {isUploading ? (
            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          ) : (
            <CheckCircle className="w-10 h-10 text-green-600" />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isUploading ? "Uploading to server..." : "Upload Complete"}
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            {isUploading
              ? "Please wait while your timetable is being processed."
              : "Finalizing..."}
          </p>
        </div>
        {isUploading && (
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <CloudUpload className="w-5 h-5" />
            <span>Sending file to server...</span>
          </div>
        )}
      </div>
    </div>
  );
}
