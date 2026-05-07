import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "@solar-icons/react";
import Logo from "@/components/Logo";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-8 max-w-md">
        <div className="space-y-4">
          <h1 className="text-8xl md:text-9xl font-bold text-primary">404</h1>
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
              Page Not Found
            </h2>
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="default"
            onClick={() => navigate({ to: "/" })}
            className="flex items-center gap-2"
          >
            <Home size={18} />
            Go Home
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Go Back
          </Button>
        </div>

        <div className="pt-8 mx-auto w-full">
          <Logo />
        </div>
      </div>
    </div>
  );
}
