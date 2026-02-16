import logo from "@/assets/13creators-logo.png";
import { cn } from "@/lib/utils";

const STEPS = ["Plan", "Signup", "Payment", "Details", "Consent", "Photos", "Booking"] as const;

interface EnrollmentHeaderProps {
  currentStep: number; // 0-indexed
}

export default function EnrollmentHeader({ currentStep }: EnrollmentHeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <a href="/" className="flex items-center gap-3">
          <img src={logo} alt="13 Creators" className="h-10" />
        </a>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          {STEPS.map((step, i) => (
            <span key={step} className="flex items-center gap-1">
              {i > 0 && <span className="mx-0.5 hidden sm:inline">→</span>}
              {i === currentStep ? (
                <>
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-foreground font-medium hidden sm:inline">{step}</span>
                </>
              ) : (
                <span className={cn("hidden sm:inline", i < currentStep && "text-primary")}>
                  {step}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
