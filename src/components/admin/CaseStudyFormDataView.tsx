import AttachmentGallery from "@/components/practitioner/AttachmentGallery";

interface CaseStudyFormDataViewProps {
  formData: Record<string, any>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="mb-2">
      <span className="text-xs font-medium text-primary italic">{label}</span>
      <p className="text-sm text-foreground whitespace-pre-wrap mt-0.5">{value}</p>
    </div>
  );
}

export default function CaseStudyFormDataView({ formData }: CaseStudyFormDataViewProps) {
  const p1 = formData.page1 || {};
  const p2 = formData.page2 || {};
  const p3 = formData.page3 || {};
  const p4 = formData.page4 || {};

  const hasP1 = Object.values(p1).some(v => v);
  const hasP2 = Object.values(p2).some(v => v);
  const hasP3 = Object.values(p3).some(v => v);
  const hasP4 = Object.values(p4).some(v => v);

  const hasAttachments = formData.attachments && Array.isArray(formData.attachments) && formData.attachments.length > 0;

  if (!hasP1 && !hasP2 && !hasP3 && !hasP4 && !hasAttachments) {
    return <p className="text-sm text-muted-foreground italic">No assessment data recorded.</p>;
  }

  return (
    <div className="space-y-4 bg-card rounded-lg border border-border p-4 max-h-[600px] overflow-y-auto">
      {hasP1 && (
        <Section title="Page 1 — Body Assessment">
          <Field label="Head / Neck" value={p1.head_neck} />
          <Field label="Chest / Arms" value={p1.chest_arms} />
          <Field label="Belly / Waist" value={p1.belly_waist} />
          <Field label="Upper Thighs / Hips / Buttocks" value={p1.upper_thighs_hips_buttocks} />
          <Field label="Legs / Feet" value={p1.legs_feet} />
        </Section>
      )}

      {hasP2 && (
        <Section title="Page 2 — Assessment Details">
          <Field label="Prominent Features — Face" value={p2.prominent_features_face} />
          <Field label="Prominent Features — Body" value={p2.prominent_features_body} />
          <Field label="Prominent Features — Hands + Feet" value={p2.prominent_features_hands_feet} />
          <Field label="Concentration of Tissue" value={p2.concentration_of_tissue} />
          <Field label="Structure Shapes" value={p2.structure_shapes} />
          <Field label="Other Ailments / Comments" value={p2.other_ailments} />
        </Section>
      )}

      {hasP3 && (
        <Section title="Page 3 — Feedback Preparation">
          <Field label="Key Features — CT1" value={p3.key_features_ct1} />
          <Field label="Key Features — CT2" value={p3.key_features_ct2} />
          <Field label="Key Features — Other" value={p3.key_features_other} />
          <Field label="Key Questions" value={p3.key_questions} />
        </Section>
      )}

      {hasP4 && (
        <Section title="Page 4 — Feedback Reflection">
          <Field label="Light Bulb Moments" value={p4.light_bulb_moments} />
          <Field label="What You Learned" value={p4.what_learned} />
          <Field label="What Went Well" value={p4.what_went_well} />
          <Field label="Potential Follow-Up" value={p4.potential_follow_up} />
        </Section>
      )}

      {formData.attachments && Array.isArray(formData.attachments) && formData.attachments.length > 0 && (
        <AttachmentGallery attachments={formData.attachments as string[]} />
      )}
    </div>
  );
}
