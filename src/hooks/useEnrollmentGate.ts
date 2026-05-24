import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  getRequiredEnrollmentPath,
  loadEnrollmentState,
  type EnrollmentState,
} from "@/lib/enrollmentGate";

/**
 * Enforces the canonical enrollment sequence. If the user is on a page they
 * haven't earned yet (e.g. /enroll/photos without practitioner+details+consent,
 * or /dashboard before completing enrollment), redirect to the required step.
 *
 * - Staff users (practitioner/trainer/admin) bypass entirely.
 * - On enrollment pages: redirect to required step if it differs from current.
 * - On /dashboard: redirect to required step if enrollment isn't complete.
 *
 * Returns { ready, state } — gate consumers should not render until `ready`
 * to avoid a flash of forbidden content.
 */
export function useEnrollmentGate(): { ready: boolean; state: EnrollmentState | null } {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<EnrollmentState | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // ProtectedRoute handles unauth redirects; nothing to do here.
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const s = await loadEnrollmentState(user.id);
        if (cancelled) return;
        setState(s);

        const required = getRequiredEnrollmentPath(s);
        const current = location.pathname;

        // Staff bypass entirely.
        if (s.isStaff) {
          setReady(true);
          return;
        }

        // Enrollment is complete: kick the user out of any /enroll/* page to dashboard,
        // EXCEPT /enroll/photos — users often return to add missing photos.
        if (required === null) {
          if (current.startsWith("/enroll") && current !== "/enroll/photos") {
            navigate("/dashboard", { replace: true });
            return;
          }
          setReady(true);
          return;
        }

        // Enrollment incomplete: allow the user to be on the required step OR any
        // earlier /enroll step they've already completed (so they can revisit and edit).
        // Only redirect when they try to skip ahead.
        const requiredPath = required.split("?")[0];
        const ENROLL_ORDER = [
          "/enroll",
          "/enroll/practitioner",
          "/enroll/details",
          "/enroll/consent",
          "/enroll/photos",
          "/enroll/booking",
        ];
        const currentIdx = ENROLL_ORDER.indexOf(current);
        const requiredIdx = ENROLL_ORDER.indexOf(requiredPath);
        const isOnAllowedEarlierStep =
          currentIdx !== -1 && requiredIdx !== -1 && currentIdx <= requiredIdx;

        if (current !== requiredPath && !isOnAllowedEarlierStep) {
          navigate(required, { replace: true });
          return;
        }

        setReady(true);

      } catch (e) {
        console.error("Enrollment gate error:", e);
        setReady(true); // fail open so we don't trap users in a blank screen
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, location.pathname, navigate]);

  return { ready, state };
}
