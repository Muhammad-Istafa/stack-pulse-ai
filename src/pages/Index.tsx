import { Link } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";

const ObsidianLogo3D = lazy(() => import("@/components/ObsidianLogo3D"));

export default function Index() {
  useEffect(() => {
    document.title = "FounderOS — Private Intelligence";
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 h-16 px-6 md:px-12 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl">
        <Link to="/" className="font-display font-thin text-[12px] tracking-[0.5em] uppercase text-primary-glow">
          FounderOS
        </Link>
        <ul className="hidden md:flex gap-9 list-none">
          {["Philosophy", "Services", "Doctrine", "Membership"].map((l) => (
            <li key={l}>
              <a href={`#${l.toLowerCase()}`} className="font-display font-thin text-[9px] tracking-[0.35em] uppercase text-foreground/60 hover:text-primary transition-colors">
                {l}
              </a>
            </li>
          ))}
        </ul>
        <Link to="/brief" className="font-display font-light text-[9px] tracking-[0.3em] uppercase text-primary border border-border px-5 py-2.5 hover:bg-primary/10 hover:border-primary transition-all">
          Enter the House
        </Link>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 72px,hsl(var(--primary)/0.04) 72px,hsl(var(--primary)/0.04) 72.5px),repeating-linear-gradient(90deg,transparent,transparent 72px,hsl(var(--primary)/0.04) 72px,hsl(var(--primary)/0.04) 72.5px)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 40%, hsl(210 40% 25% / 0.18) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center max-w-4xl">
          <div className="mb-2 -mt-4">
            <Suspense fallback={<div style={{ width: 260, height: 260 }} />}>
              <ObsidianLogo3D size={260} />
            </Suspense>
          </div>

          <p className="font-display font-thin text-[10px] tracking-[0.5em] uppercase text-primary mb-6">
            Established · MMXXV · By Introduction Only
          </p>

          <h1 className="font-serif-display text-[clamp(64px,9vw,124px)] font-light leading-[0.92] tracking-tight text-primary-glow">
            FounderOS
            <em className="block not-italic text-[0.36em] tracking-[0.6em] text-foreground/60 font-light mt-3 uppercase">
              Intelligence
            </em>
          </h1>

          <div className="flex items-center gap-4 my-8">
            <span className="block h-px w-20 bg-border" />
            <span className="ornament-diamond" />
            <span className="block h-px w-20 bg-border" />
          </div>

          <p className="font-serif-display italic text-lg md:text-xl font-light leading-[1.8] text-foreground/60 max-w-md">
            Counsel for principals who cannot afford to be merely informed.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Link
              to="/brief"
              className="font-display font-light text-[10px] tracking-[0.4em] uppercase text-primary border border-primary/40 px-12 py-5 hover:bg-primary/10 hover:text-primary-glow hover:border-primary transition-all"
            >
              Descend
            </Link>
            <Link
              to="/ops"
              className="font-display font-light text-[10px] tracking-[0.4em] uppercase text-foreground/60 border border-border px-12 py-5 hover:text-primary hover:border-primary/40 transition-all"
            >
              The Ops Agent
            </Link>
          </div>
        </div>
      </section>

      {/* PROPOSITION */}
      <section id="philosophy" className="px-6 py-28 text-center border-t border-border">
        <span className="block font-display font-thin text-[9px] tracking-[0.5em] uppercase text-primary mb-10">The House</span>

        <p className="font-serif-display italic text-[clamp(22px,3vw,34px)] font-light leading-[1.5] text-foreground max-w-2xl mx-auto">
          We exist at the intersection of <em className="not-italic text-primary">capital</em>, <em className="not-italic text-primary">foresight</em>, and the <em className="not-italic text-primary">artificial mind</em> —
          where the distance between a question and its consequence is measured not in days, but in the quality of the decision made before dawn.
        </p>

        <div className="mt-20 grid md:grid-cols-3 border border-border max-w-5xl mx-auto">
          {[
            { num: "I · Clarity", title: "Signal from noise", body: "We do not aggregate. We distill. Every brief delivered to a member has been argued against, pressure-tested, and reduced to its essential consequential truth." },
            { num: "II · Speed", title: "At the velocity of events", body: "By the time a report is published, it is history. Our principals receive the implications of a development before the market has named it." },
            { num: "III · Discretion", title: "The counsel that does not leave the room", body: "No attribution. No records. FounderOS operates on invitation, confidential by architecture, and exists only between advisor and principal." },
          ].map((p, i) => (
            <div key={p.num} className={`p-10 text-left ${i < 2 ? "md:border-r border-border" : ""} ${i < 2 ? "border-b md:border-b-0 border-border" : ""}`}>
              <span className="block font-display font-thin text-[9px] tracking-[0.3em] text-primary mb-4">{p.num}</span>
              <h3 className="font-serif-display text-[21px] font-medium text-foreground mb-3 leading-tight">{p.title}</h3>
              <p className="font-serif-display text-[15px] font-light leading-[1.85] text-foreground/60">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="px-6 py-28 bg-card border-t border-b border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <span className="block font-display font-thin text-[9px] tracking-[0.5em] uppercase text-primary mb-6">The Work</span>
            <h2 className="font-serif-display text-[clamp(36px,5vw,58px)] font-light text-primary-glow mb-4 tracking-tight">What We Offer</h2>
            <p className="font-serif-display italic text-base font-light text-foreground/60 max-w-md mx-auto leading-[1.75]">
              Two disciplines. One unwavering standard. The kind of work that changes the decision before the decision is made.
            </p>
          </div>

          <div className="flex flex-col">
            {[
              { rom: "I.", name: "Ops Agent", sub: "for those who set the direction", desc: "Investor replies, customer comms, partnership emails — drafted with real context, ready to send. Bespoke commitments tracked. No auto-execution; only counsel." },
              { rom: "II.", name: "Tech Agent", sub: "for those who think in decades", desc: "Recommendation, sandbox test, migration plan. Confidence scored, sourced, risk-assessed. Decisions delivered, not delegated." },
              { rom: "III.", name: "Daily Brief", sub: "the conversation written down", desc: "A morning intelligence brief: commitments overdue, workflows awaiting your hand, the day prioritised before you have asked." },
            ].map((s, i) => (
              <div key={s.rom} className={`grid grid-cols-[60px_1fr] md:grid-cols-[72px_1fr_1fr] gap-6 py-12 ${i < 2 ? "border-b border-border" : ""} hover:bg-primary/[0.02] transition-colors`}>
                <span className="font-serif-display italic text-[15px] font-light text-primary tracking-[0.15em] pt-1">{s.rom}</span>
                <div>
                  <h3 className="font-serif-display text-[28px] font-light text-foreground tracking-tight">{s.name}</h3>
                  <p className="font-serif-display italic text-[13px] font-light text-foreground/30 mt-1">{s.sub}</p>
                </div>
                <p className="font-serif-display text-[15px] font-light leading-[1.85] text-foreground/60 pt-1 col-span-2 md:col-span-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOCTRINE / quote */}
      <section
        id="doctrine"
        className="px-6 py-32 text-center border-t border-b"
        style={{ background: "hsl(210 40% 12%)", borderColor: "hsl(210 50% 25% / 0.4)" }}
      >
        <div className="flex justify-center items-center gap-4 mb-12">
          <span className="block h-px w-20" style={{ background: "hsl(38 44% 61% / 0.3)" }} />
          <span className="ornament-diamond" />
          <span className="block h-px w-20" style={{ background: "hsl(38 44% 61% / 0.3)" }} />
        </div>
        <p className="font-serif-display italic text-[clamp(22px,3.2vw,36px)] font-light leading-[1.65] text-foreground max-w-3xl mx-auto">
          "The question has never been whether to act on intelligence — it has always been whether the intelligence was worth acting on."
        </p>
        <p className="mt-12 font-display font-thin text-[9px] tracking-[0.4em] uppercase text-primary/50">
          FounderOS · Internal Doctrine · MMXXV
        </p>
      </section>

      {/* MEMBERSHIP */}
      <section id="membership" className="px-6 py-28 text-center">
        <span className="block font-display font-thin text-[9px] tracking-[0.5em] uppercase text-primary mb-8">Admission</span>
        <h2 className="font-serif-display text-[clamp(44px,7vw,82px)] font-light text-primary-glow tracking-tight mb-5">Membership</h2>
        <p className="font-serif-display italic text-[17px] font-light text-foreground/60 max-w-lg mx-auto leading-[1.8] mb-16">
          FounderOS does not advertise. We extend access to founders referred by existing members, or those who have come to our attention through work of consequence.
        </p>

        <div className="flex flex-col md:flex-row max-w-3xl mx-auto border border-border mb-16">
          {[
            { n: "Step One", t: "Submit an Introduction", d: "A letter of introduction and the name of your referring member, if applicable. No forms. A letter, as one would write to a house." },
            { n: "Step Two", t: "Private Consultation", d: "A confidential conversation with a senior advisor to understand your situation and assess mutual fit. Held in strict confidence regardless of outcome." },
            { n: "Step Three", t: "Engagement Begins", d: "Upon acceptance, your standing engagement commences. No contracts. No subscriptions. Only the standard to which we hold ourselves, and you." },
          ].map((s, i) => (
            <div key={s.n} className={`flex-1 p-10 text-left ${i < 2 ? "md:border-r border-b md:border-b-0 border-border" : ""}`}>
              <span className="block font-display font-thin text-[9px] tracking-[0.3em] text-primary mb-3">{s.n}</span>
              <h3 className="font-serif-display text-[17px] font-medium text-foreground mb-2.5">{s.t}</h3>
              <p className="font-serif-display text-[13.5px] font-light text-foreground/60 leading-[1.75]">{s.d}</p>
            </div>
          ))}
        </div>

        <Link
          to="/brief"
          className="inline-block font-display font-light text-[10px] tracking-[0.4em] uppercase text-primary border border-border px-14 py-5 hover:bg-primary/10 hover:text-primary-glow hover:border-primary transition-all"
        >
          Request Admission
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-14 text-center border-t border-border">
        <span className="block font-display font-thin text-[10px] tracking-[0.6em] uppercase mb-4" style={{ color: "hsl(38 44% 61% / 0.5)" }}>
          FounderOS
        </span>
        <p className="font-display font-thin text-[11px] tracking-[0.2em] text-foreground/30">
          Private Intelligence · By introduction only · MMXXV · All enquiries held in the strictest confidence
        </p>
      </footer>
    </div>
  );
}
