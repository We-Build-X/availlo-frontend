import { useState, useRef } from "react";
import {
  CloudUpload,
  DocumentText,
   ArrowRight,
} from "@solar-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Step1UploadProps {
  facultyName: string;
  onNext: () => void;
}

export function Step1Upload({ facultyName, onNext }: Step1UploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        alert("Please upload a PDF file.");
      }
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Badge className="bg-blue-600 text-white hover:bg-blue-700 text-sm px-3 py-1 font-bold">
          {facultyName}
        </Badge>
        <p className="text-slate-500 text-sm mt-3 font-medium">
          Configure parameters for the incoming timetable data.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Source File
        </label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
            file
              ? "border-blue-500 bg-blue-50/50"
              : "border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100"
          }`}
        >
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.length) setFile(e.target.files[0]);
            }}
          />
          {file ? (
            <>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <DocumentText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {file.name}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB • PDF
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                <CloudUpload className="w-6 h-6 text-slate-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Drop timetable PDF here
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                or click to browse from your computer
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          disabled={!file}
          size="lg"
          className="w-full sm:w-auto"
        >
          Continue <ArrowRight className="size-5" />
        </Button>
      </div>
    </div>
  );
}
