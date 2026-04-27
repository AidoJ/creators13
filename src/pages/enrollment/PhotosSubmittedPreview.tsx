import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import EnrollmentHeader from "@/components/enrollment/EnrollmentHeader";

// TEMPORARY PREVIEW ROUTE — mirrors the case study confirmation screen
// rendered inside src/pages/enrollment/Photos.tsx (caseStudyComplete branch).
// Safe to delete once review is complete.
export default function PhotosSubmittedPreview() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <EnrollmentHeader currentStep={6} />
      <main className="container mx-auto px-4 py-10 max-w-lg">
        <div className="mb-6 rounded-2xl border-2 border-primary/40 bg-primary/10 px-5 py-4 text-center">
          <p className="text-sm font-semibold text-foreground leading-relaxed">
            📬 Please check your junk folder for an email from{" "}
            <span className="text-primary">info@13creators.com</span>
          </p>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-5">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-3">
            Photos Submitted!
          </h1>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-display font-bold text-foreground">
            What Happens Now?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your trainee Practitioner will review your photos and share their feedback with you in a conversation about your Creator Types. If you haven't already, please make a time with your practitioner within the next few weeks to have this conversation.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed font-medium">
            Thank you for volunteering to be a case study!
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => navigate("/dashboard")}
            size="lg"
            className="rounded-full px-10 py-3 h-auto min-h-11 text-base font-semibold"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </main>
    </div>
  );
}
