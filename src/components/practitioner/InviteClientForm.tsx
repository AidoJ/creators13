import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Copy, CheckCircle, Send, Loader2, Mail, ExternalLink } from "lucide-react";

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

  useEffect(() => {
    if (!user) return;
    fetchInvitations();
  }, [user]);

  async function fetchInvitations() {
    const { data } = await supabase
      .from("client_invitations")
      .select("*")
      .eq("practitioner_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setInvitations(data as Invitation[]);
  }

  function getInviteLink(token: string) {
    const base = window.location.origin;
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

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Client invited", description: `Invitation created for ${name}. Copy the link and send it to them.` });
    setName("");
    setEmail("");
    setPhone("");
    fetchInvitations();
  }

  function handleCopyLink(inv: Invitation) {
    const link = getInviteLink(inv.invite_token);
    navigator.clipboard.writeText(link);
    setCopiedId(inv.id);
    toast({ title: "Link copied!", description: "Share this link with your client." });
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleEmailLink(inv: Invitation) {
    const link = getInviteLink(inv.invite_token);
    const subject = encodeURIComponent("You're invited to join 13 Creators");
    const body = encodeURIComponent(
      `Hi ${inv.name},\n\nYou've been invited to join 13 Creators as a case study participant.\n\nClick the link below to get started:\n${link}\n\nLooking forward to working with you!`
    );
    window.open(`mailto:${inv.email}?subject=${subject}&body=${body}`, "_blank");
  }

  return (
    <div className="space-y-6">
      {/* ── Hero info card ── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Creator Types Case Study</p>
          <h2 className="text-xl font-display font-bold text-foreground">Volunteer Information &amp; Consent</h2>
        </div>

        {/* YouTube embed */}
        <div className="px-6 pt-5">
          <div className="relative w-full rounded-xl overflow-hidden bg-muted" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/N_hAuOoWFjM"
              title="12 CREATOR TYPES In 12 Minutes"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Body copy */}
        <div className="px-6 py-5 space-y-4 text-sm text-foreground leading-relaxed">
          <p className="text-base font-semibold text-primary">Greetings Beautiful Body!</p>

          <p>
            Thank you for your interest in volunteering as a case study for the{" "}
            <a
              href="http://sacredbusiness.com.au/wp-content/uploads/2026/02/2026-13CREATORS-Training-Prospectus.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80 inline-flex items-center gap-1"
            >
              13CREATORS Practitioner Training <ExternalLink className="h-3 w-3" />
            </a>
            .
          </p>

          <p>
            To become a case study, you'll be invited to share{" "}
            <a
              href="https://sacredbusiness.com.au/creator-constitution-instructions/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              8 photos of your full body
            </a>{" "}
            wearing swimwear or yoga gear.
          </p>

          <p>
            In exchange, you will learn about two of your Creator Types, according to your body shape, facial features,
            hands and feet. Your Creator Types blueprint will give you a deeper awareness of your natural abilities,
            challenges and the purpose of your particular physical constitution, both individually and in groups. In
            other words, what purpose are you naturally built for?
          </p>

          <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 text-sm">
            <p className="font-medium text-primary">
              Your photos will only be shared within class for teaching purposes and viewed only by students and the
              teacher and inventor of the Creator Types, A'Hara.
            </p>
          </div>

          <p>
            If you would like to proceed, please talk to your Trainee Practitioner about next steps.
          </p>

          <p>
            For more information, have a read of{" "}
            <a
              href="https://sacredbusiness.com.au/not-creators-made-equal/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              Not All Creators Were Made Equal
            </a>{" "}
            or the FAQs{" "}
            <a
              href="https://sacredbusiness.com.au/wp-content/uploads/2025/03/Creator-Types-FAQs-2025.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              here
            </a>
            .
          </p>

          <p className="text-center font-display font-semibold text-base text-primary pt-2">
            Be Curious &amp; Have Fun Learning About Your Body!
          </p>
          <p className="text-center text-xs text-muted-foreground">
            <a href="https://www.creatortypes.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary underline underline-offset-2">
              www.creatortypes.com
            </a>
          </p>
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
                      {copiedId === inv.id ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
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
