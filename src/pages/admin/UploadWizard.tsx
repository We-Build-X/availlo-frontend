import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { MOCK_FACULTY_STATUSES } from "@/lib/mock-data";
import { adminTimetableUploadRoute } from "@/router";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/ENDPOINTS";
import type { TimetableUploadResponse } from "@/lib/api-types";

import { Step1Upload } from "@/components/admin/UploadWizard/Step1Upload";
import { Step2Processing } from "@/components/admin/UploadWizard/Step2Processing";
import { Step4Finish } from "@/components/admin/UploadWizard/Step4Finish";

const STEPS = ["PDF Upload", "Process", "Finish"];

export default function AdminUploadWizard() {
  const { id } = adminTimetableUploadRoute.useParams();
  const search = adminTimetableUploadRoute.useSearch();
  const navigate = useNavigate({ from: adminTimetableUploadRoute.id });
  const step = search.step || 1;

  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<
    TimetableUploadResponse | undefined
  >(undefined);

  const uploadMutation = useMutation({
    mutationFn: async (uploadFile: File) => {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("semester_id", "1");
      const { data } = await api.post<TimetableUploadResponse>(
        ENDPOINTS.timetable.upload,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data;
    },
    onSuccess: (data) => {
      setUploadResult(data);
      navigate({ search: { step: 3 } });
    },
    onError: () => {},
  });

  const handleRetry = () => {
    uploadMutation.reset();
    if (file) uploadMutation.mutate(file);
  };

  const handleUpload = (uploadFile: File) => {
    setFile(uploadFile);
    uploadMutation.mutate(uploadFile);
    navigate({ search: { step: 2 } });
  };

  const faculty = MOCK_FACULTY_STATUSES.find((f) => f.id === id);

  if (!faculty) {
    return <div className="p-8">Faculty not found.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 pb-20 animate-in fade-in pt-4">
      <div className="">
        <div className="text-sm font-medium text-slate-500 mb-1">
          Step {step} of 3: {STEPS[step - 1]}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-10">
          Timetable Upload
        </h1>

        {/* Stepper */}
        <div className="flex justify-between w-full max-w-5xl mb-8 mx-auto">
          {STEPS.map((label, i) => {
            const num = i + 1;
            const isActive = step === num;
            const isPast = step > num;
            const isLast = i === STEPS.length - 1;
            return (
              <div
                key={label}
                className="relative flex flex-col items-center flex-1"
              >
                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className="absolute top-[17px] md:top-[20px] left-[50%] h-[2px] bg-slate-200"
                    style={{ width: "calc(100% - 3rem)", marginLeft: "1.5rem" }}
                  />
                )}
                {/* Circle */}
                <div
                  onClick={() => isPast && navigate({ search: { step: num } })}
                  className={`size-10 md:size-12 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : isPast
                        ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {num}
                </div>
                {/* Label */}
                <div
                  className={`mt-2 text-xs font-bold ${
                    isActive || isPast ? "text-primary" : "text-slate-500"
                  }`}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Container */}
      <div className="relative">
        <div className="sm:pt-4">
          {step === 1 && (
            <Step1Upload
              facultyName={faculty.facultyName}
              file={file}
              onFileChange={setFile}
              onNext={() => file && handleUpload(file)}
            />
          )}
          {step === 2 && (
            <Step2Processing
              isUploading={uploadMutation.isPending}
              uploadError={uploadMutation.error?.message}
              onRetry={handleRetry}
            />
          )}
          {step === 3 && (
            <Step4Finish
              facultyName={faculty.facultyName}
              uploadResult={uploadResult}
            />
          )}
        </div>
      </div>
    </div>
  );
}
