import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "@solar-icons/react";
import { MOCK_FACULTY_STATUSES } from "@/lib/mock-data";
import { adminTimetableUploadRoute } from "@/router";

import { Step1Upload } from "@/components/admin/UploadWizard/Step1Upload";
import { Step2Processing } from "@/components/admin/UploadWizard/Step2Processing";
import { Step3Review } from "@/components/admin/UploadWizard/Step3Review";
import { Step4Finish } from "@/components/admin/UploadWizard/Step4Finish";

const STEPS = ["PDF Upload", "Process", "Review", "Finish"];

export default function AdminUploadWizard() {
  const { id } = adminTimetableUploadRoute.useParams();
  const search = adminTimetableUploadRoute.useSearch();
  const navigate = useNavigate({ from: adminTimetableUploadRoute.id });
  const step = search.step || 1;

  const faculty = MOCK_FACULTY_STATUSES.find((f) => f.id === id);

  if (!faculty) {
    return <div className="p-8">Faculty not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 pb-20 animate-in fade-in pt-4">
      {/* Back Button */}
      <div className="flex items-center gap-4 mb-2">
        <Link
          to="/admin/timetables"
          className="p-2 hover:bg-slate-200 rounded-full transition-colors -ml-2"
        >
          <ArrowLeft className="size-6 text-slate-600" />
        </Link>
      </div>

      <div className="px-2 sm:px-4">
        <div className="text-sm font-medium text-slate-500 mb-1">
          Step {step} of 4: {STEPS[step - 1]}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-10">
          Timetable Upload
        </h1>

        {/* Stepper */}
        <div className="flex justify-between w-full max-w-2xl mb-8 mx-auto">
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
                    className="absolute top-[15px] left-[50%] h-[2px] bg-slate-200"
                    style={{ width: "calc(100% - 3rem)", marginLeft: "1.5rem" }}
                  />
                )}
                {/* Circle */}
                <div
                  onClick={() =>
                    isPast && navigate({ search: { step: num } })
                  }
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-colors ${
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
        {/* Content Area */}
        <div className="sm:pt-4">
          {step === 1 && (
            <Step1Upload
              facultyName={faculty.facultyName}
              onNext={() => navigate({ search: { step: 2 } })}
            />
          )}
          {step === 2 && (
            <Step2Processing onNext={() => navigate({ search: { step: 3 } })} />
          )}
          {step === 3 && (
            <Step3Review
              onNext={() => navigate({ search: { step: 4 } })}
              onBack={() => navigate({ search: { step: 1 } })}
            />
          )}
          {step === 4 && <Step4Finish facultyName={faculty.facultyName} />}
        </div>
      </div>
    </div>
  );
}
