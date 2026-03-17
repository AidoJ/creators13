import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Copy, CheckCircle, Send, Loader2, Mail } from "lucide-react";
import { getAppOrigin } from "@/lib/appOrigin";

interface Invitation {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  invite_token: string;
  created_at: string;
}

interface InviteClientFormProps {
  practitionerCode: string | null;
}

export default function InviteClientForm({ practitionerCode }: InviteClientFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [templateHtml, setTemplateHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchInvitations();
    fetchTemplate();
  }, [user]);

  async function fetchTemplate() {
    const { data } = await supabase
      .from("email_templates")
      .select("html_body")
      .eq("template_key", "case_study_invite")
      .single();
    if (data) setTemplateHtml(data.html_body);
  }

  const previewHtml = useMemo(() => {
    if (!templateHtml) return null;
    return templateHtml
      .replace(/\{\{clientName\}\}/g, "there")
      .replace(/\{\{inviteLink\}\}/g, "#");
  }, [templateHtml]);

  async function fetchInvitations() {
    const { data } = await supabase
      .from("client_invitations")
      .select("*")
      .eq("practitioner_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setInvitations(data as Invitation[]);
  }

  function getInviteLink(token: string) {
    const base = getAppOrigin();
    const params = new URLSearchParams({
      tier: "wren",
      billing: "monthly",
      case_study: "true",
      practitioner_code: practitionerCode || "",
      invite: token,
    });
    return `${base}/enroll?${params.toString()}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !practitionerCode) return;

    setLoading(true);
    const { data, error } = await supabase.from("client_invitations").insert({
      practitioner_id: user.id,
      name,
      email,
      phone: phone || null,
    }).select().single();

    if (error) {
      setLoading(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Send rich HTML email via Resend edge function
    if (data) {
      const inv = data as Invitation;
      const inviteLink = getInviteLink(inv.invite_token);
      const { error: emailError } = await supabase.functions.invoke("send-invite-email", {
        body: { to: inv.email, clientName: inv.name, inviteLink },
      });

      if (emailError) {
        console.error("Email send error:", emailError);
        toast({ title: "Invitation created", description: `Saved but email delivery failed. You can resend or copy the link.`, variant: "destructive" });
      } else {
        toast({ title: "Invitation sent!", description: `A beautifully formatted email has been sent to ${name}.` });
      }
    }

    setLoading(false);
    setName("");
    setEmail("");
    setPhone("");
    fetchInvitations();
  }

  function openInvitationEmail(inv: Invitation) {
    const link = getInviteLink(inv.invite_token);
    const subject = encodeURIComponent("You're Invited to Join 13 Creators as a Case Study");
    const body = encodeURIComponent(
`Greetings Beautiful Body!

Thank you for your interest in volunteering as a case study for the 13CREATORS Practitioner Training.

To become a case study, you'll be invited to share 8 photos of your full body wearing swimwear or yoga gear.
(Photo instructions: https://sacredbusiness.com.au/creator-constitution-instructions/)

In exchange, you will learn about two of your Creator Types, according to your body shape, facial features, hands and feet. Your Creator Types blueprint will give you a deeper awareness of your natural abilities, challenges and the purpose of your particular physical constitution, both individually and in groups. In other words, what purpose are you naturally built for?

Your photos will only be shared within class for teaching purposes and viewed only by students and the teacher and inventor of the Creator Types, A'Hara.

To get started, click your personal invitation link below:
${link}

For more information:
- Not All Creators Were Made Equal: https://sacredbusiness.com.au/not-creators-made-equal/
- FAQs: https://sacredbusiness.com.au/wp-content/uploads/2025/03/Creator-Types-FAQs-2025.pdf
- 13CREATORS Training Prospectus: http://sacredbusiness.com.au/wp-content/uploads/2026/02/2026-13CREATORS-Training-Prospectus.pdf

Be Curious & Have Fun Learning About Your Body!

www.creatortypes.com`
    );
    window.open(`mailto:${inv.email}?subject=${subject}&body=${body}`, "_blank");
  }

  function handleCopyLink(inv: Invitation) {
    const link = getInviteLink(inv.invite_token);
    navigator.clipboard.writeText(link);
    setCopiedId(inv.id);
    toast({ title: "Link copied!", description: "Share this link with your client." });
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleEmailLink(inv: Invitation) {
    const inviteLink = getInviteLink(inv.invite_token);
    const { error } = await supabase.functions.invoke("send-invite-email", {
      body: { to: inv.email, clientName: inv.name, inviteLink },
    });
    if (error) {
      toast({ title: "Email failed", description: "Could not resend. Try copying the link instead.", variant: "destructive" });
    } else {
      toast({ title: "Email resent!", description: `Invitation re-sent to ${inv.email}.` });
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Hero info card ── */}
      <div className="rounded-2xl overflow-hidden border border-secondary/30 shadow-lg">

        {/* Gradient hero header */}
        <div className="relative bg-gradient-to-br from-primary via-primary/90 to-secondary px-8 py-10 text-center overflow-hidden">
          {/* Decorative orbs */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-secondary/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-accent/20 blur-2xl pointer-events-none" />

          <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70 mb-2">
            Creator Types Case Study
          </p>
          <h2 className="relative text-3xl font-display font-bold text-primary-foreground leading-tight mb-1">
            Volunteer Information
          </h2>
          <p className="relative text-lg font-display text-secondary/90 font-medium tracking-wide">
            &amp; Consent
          </p>
        </div>

        {/* YouTube embed */}
        <div className="bg-foreground/5 px-6 py-6 border-b border-secondary/20">
          <div className="relative w-full rounded-xl overflow-hidden shadow-md" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/N_hAuOoWFjM"
              title="12 CREATOR TYPES In 12 Minutes"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3 italic">Watch: 12 Creator Types In 12 Minutes</p>
        </div>

        {/* Body copy */}
        <div className="bg-card px-8 py-7 space-y-5 text-sm text-foreground leading-relaxed">
          {/* Greeting */}
          <p className="text-xl font-display font-bold text-primary">Greetings Beautiful Body!</p>

          <p>
            Thank you for your interest in volunteering as a case study for the{" "}
            <a
              href="http://sacredbusiness.com.au/wp-content/uploads/2026/02/2026-13CREATORS-Training-Prospectus.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80 inline-flex items-center gap-1 font-medium"
            >
              13CREATORS Practitioner Training <ExternalLink className="h-3 w-3" />
            </a>
            .
          </p>

          {/* Photos callout */}
          <div className="rounded-xl bg-gradient-to-r from-secondary/15 to-secondary/5 border border-secondary/30 px-5 py-4 flex items-start gap-3">
            <span className="text-2xl mt-0.5">📸</span>
            <p>
              To become a case study, you'll be invited to share{" "}
              <a
                href="https://sacredbusiness.com.au/creator-constitution-instructions/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:opacity-80 font-semibold"
              >
                8 photos of your full body
              </a>{" "}
              wearing swimwear or yoga gear.
            </p>
          </div>

          <p>
            In exchange, you will learn about two of your Creator Types, according to your body shape, facial features,
            hands and feet. Your Creator Types blueprint will give you a deeper awareness of your natural abilities,
            challenges and the purpose of your particular physical constitution, both individually and in groups. In
            other words, <span className="font-semibold text-foreground">what purpose are you naturally built for?</span>
          </p>

          {/* Privacy notice */}
          <div className="rounded-xl bg-primary/10 border border-primary/20 px-5 py-4 text-sm flex items-start gap-3">
            <span className="text-xl mt-0.5">🔒</span>
            <p className="font-medium text-primary/90">
              Your photos will only be shared within class for teaching purposes and viewed only by students and the
              teacher and inventor of the Creator Types, A'Hara.
            </p>
          </div>

          <p>
            If you would like to proceed, please talk to your Trainee Practitioner about next steps.
          </p>

          {/* More info links */}
          <div className="rounded-xl bg-accent/10 border border-accent/20 px-5 py-4 text-sm space-y-2">
            <p className="font-semibold text-foreground text-xs uppercase tracking-wide mb-2">For more information</p>
            <p>
              📖 Read{" "}
              <a
                href="https://sacredbusiness.com.au/not-creators-made-equal/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:opacity-80 font-medium"
              >
                Not All Creators Were Made Equal
              </a>
            </p>
            <p>
              📋 Browse the{" "}
              <a
                href="https://sacredbusiness.com.au/wp-content/uploads/2025/03/Creator-Types-FAQs-2025.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:opacity-80 font-medium"
              >
                Creator Types FAQs
              </a>
            </p>
          </div>

          {/* Closing */}
          <div className="pt-2 border-t border-secondary/20 text-center space-y-1">
            <p className="font-display font-bold text-lg text-primary">
              Be Curious &amp; Have Fun Learning About Your Body!
            </p>
            <p className="text-xs text-muted-foreground">
              <a href="https://www.creatortypes.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary underline underline-offset-2">
                www.creatortypes.com
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* ── Invite form ── */}
      {practitionerCode ? (
        <>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
              <UserPlus className="h-4 w-4 text-primary" />
              Create a Client Invitation
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Fill in the details below to generate a personalised invite link for your case study client.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email *</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+61 400 000 000" />
                </div>
              </div>
              <Button type="submit" size="sm" disabled={loading || !name || !email}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><UserPlus className="h-3.5 w-3.5 mr-1" /> Create Invitation</>}
              </Button>
            </form>
          </div>

          {/* Invitation list */}
          {invitations.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" />
                  Sent Invitations
                  <span className="text-muted-foreground font-normal ml-auto">{invitations.length}</span>
                </h3>
              </div>
              <div className="divide-y divide-border">
                {invitations.map((inv) => (
                  <div key={inv.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{inv.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{inv.email} {inv.phone ? `• ${inv.phone}` : ""}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize flex-shrink-0">
                      {inv.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 flex-shrink-0"
                      onClick={() => handleCopyLink(inv)}
                      title="Copy invite link"
                    >
                      {copiedId === inv.id ? <CheckCircle className="h-3.5 w-3.5 text-forest" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 flex-shrink-0"
                      onClick={() => handleEmailLink(inv)}
                      title="Email invite link"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground text-sm">
          You need a practitioner code to invite clients. Contact your trainer.
        </div>
      )}
    </div>
  );
}
