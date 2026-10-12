"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, ArrowUpRight, Check, FlaskConical, Layers, SlidersHorizontal } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { navigationLabels } from "@/components/layout/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TextField, TextAreaField, SelectField } from "@/components/ui/form-field";

const demoLinks = navigationLabels.map(label => ({ label, href: `#demo-${label.toLowerCase().replaceAll(" ", "-")}` }));
const palette = [
  ["Canvas", "#07111F"], ["Navy", "#0C1726"], ["Raised", "#101D2D"],
  ["White", "#FFFFFF"], ["Light", "#F7F9FC"], ["Accent", "#16C2FF"], ["Research", "#465FFF"],
];

function DemoForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [message, setMessage] = useState("");
  const nameInput = useRef<HTMLInputElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = {
      name: name.trim() ? undefined : "Enter a name for this demo.",
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? undefined : "Enter an email address in the correct format.",
    };
    setErrors(next);
    setMessage("");
    if (next.name) nameInput.current?.focus();
    else if (next.email) emailInput.current?.focus();
    else setMessage("Demo validated locally. No data was sent.");
  }
  return <form className="demo-form" noValidate onSubmit={submit} aria-label="Local validation demo">
    <TextField id="demo-name" ref={nameInput} label="Name" autoComplete="name" required value={name}
      onChange={e => setName(e.target.value)} error={errors.name} hint="Use sample text; this form does not send data." />
    <TextField id="demo-email" ref={emailInput} label="Email" autoComplete="email" type="email" required value={email}
      onChange={e => setEmail(e.target.value)} error={errors.email} placeholder="name@example.com" />
    <SelectField id="demo-interest" label="Demo category" defaultValue="engineering">
      <option value="engineering">Engineering</option><option value="research">Research</option><option value="learning">Learning</option>
    </SelectField>
    <TextAreaField id="demo-notes" label="Notes" hint="Optional sample text only." placeholder="Try the shared text area…" rows={3} />
    <Button type="submit">Validate demo<ArrowRight aria-hidden="true" /></Button>
    <p role="status" className="demo-status">{message || "Demo form · No API connection"}</p>
  </form>;
}

function ButtonSamples() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Interact with these demo controls to inspect their states.");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function load() {
    setLoading(true);
    setStatus("Local demo timer running. No request was sent.");
    timer.current = setTimeout(() => {
      setLoading(false);
      setStatus("Demo timer finished. No request was sent.");
    }, 1500);
  }
  return <div className="showcase-stack">
    <div><span className="showcase-label">Variants / hover / keyboard focus</span>
      <div className="showcase-row">
        <Button onClick={() => setStatus("Primary demo selected. No action was sent.")}>Primary<ArrowUpRight aria-hidden="true" /></Button>
        <Button variant="secondary" onClick={() => setStatus("Secondary demo selected.")}>Secondary</Button>
        <Button variant="ghost" onClick={() => setStatus("Ghost demo selected.")}>Ghost<ArrowRight aria-hidden="true" /></Button>
        <Button variant="research" onClick={() => setStatus("Research demo selected.")}>Research<FlaskConical aria-hidden="true" /></Button>
      </div>
    </div>
    <div><span className="showcase-label">Disabled / loading</span><div className="showcase-row">
      <Button disabled>Disabled</Button>
      <Button variant="secondary" loading={loading} loadingLabel="Preparing demo…" onClick={load}>Run loading demo</Button>
      <Button variant="secondary" loading loadingLabel="Loading sample…">Loading sample</Button>
    </div><p role="status" className="demo-status">{status}</p></div>
  </div>;
}

export function DesignSystemPreview() {
  return <>
    <a className="skip-link" href="#preview-main">Skip to preview content</a>
    <div className="preview-notice"><Container><span><strong>Development only</strong> / Design system</span><span>Demo content · Navigation stays in this preview</span></Container></div>
    <Navbar links={demoLinks} wordmarkHref="/design-system" demo />
    <main id="preview-main" tabIndex={-1}>
      <Section tone="dark" className="preview-hero">
        <span className="eyebrow"><SlidersHorizontal aria-hidden="true" />Techy Fellow / Interface foundations</span>
        <h1>Engineered for clarity.<br /><span>A shared visual language.</span></h1>
        <p className="hero-description">A development canvas for typography, surfaces and accessible controls. These are interface samples, not finished product pages.</p>
        <nav className="preview-index" aria-label="Preview sections">
          {["Foundations", "Components", "Forms", "Navigation"].map(label => <a key={label} href={`#${label.toLowerCase()}`}>{label}<ArrowRight aria-hidden="true" /></a>)}
        </nav>
      </Section>
      <Section id="foundations" aria-labelledby="foundations-title">
        <div className="section-heading"><div><span className="eyebrow">01 / Foundations</span><h2 id="foundations-title">Quiet surfaces. Clear hierarchy.</h2><p>Navy and light canvases with cyan reserved for action. Research has its own accent.</p></div><Badge>Tailwind 4 · Semantic tokens</Badge></div>
        <div className="palette">{palette.map(([label, color]) => <div key={label} className="swatch"><div className="swatch-color" style={{ backgroundColor: color }} aria-hidden="true" /><p>{label}</p><code>{color}</code></div>)}</div>
        <div className="type-specimen"><div><span className="showcase-label">Geist Sans / 400–650</span><h3>Ideas deserve a clear interface.</h3><p>Locally bundled Geist with system fallbacks. Comfortable body text, measured line lengths and a consistent type scale.</p></div><div><span className="showcase-label">Geist Mono / annotations</span><code>surface / action / research<br />card radius: 12–16px<br />control target: ≥ 44px</code></div></div>
      </Section>
      <Section tone="navy" id="components" aria-labelledby="components-title">
        <div className="section-heading"><div><span className="eyebrow">02 / Components</span><h2 id="components-title">The core interface kit.</h2><p>Try hover and keyboard focus, disabled controls and a real local loading state.</p></div><Badge variant="accent">Shared components</Badge></div>
        <Card><ButtonSamples /></Card>
        <div className="showcase-row" style={{ marginBlock: "2rem" }}><Badge>Neutral</Badge><Badge variant="accent">Accent</Badge><Badge variant="research">Research</Badge><Badge variant="success"><Check aria-hidden="true" />Success state</Badge></div>
        <div className="component-grid">
          <Card><div className="card-icon"><Layers aria-hidden="true" /></div><h3>Default card</h3><p>A calm content surface with a 16px radius and a subtle border. Sample content only.</p></Card>
          <Card variant="research"><div className="card-icon research"><FlaskConical aria-hidden="true" /></div><h3>Research variant</h3><p>A distinct accent for research content, without relying on color alone.</p></Card>
          <Card><div className="card-icon"><SlidersHorizontal aria-hidden="true" /></div><h3>Composable by default</h3><p>Container, Section and Card inherit semantic colors from their surrounding surface.</p></Card>
        </div>
      </Section>
      <Section id="forms" aria-labelledby="forms-title">
        <div className="section-heading"><div><span className="eyebrow">03 / Form fields</span><h2 id="forms-title">Clear labels. Useful feedback.</h2><p>Submit the empty demo to inspect errors and focus on the first invalid field.</p></div><Badge>Local validation demo</Badge></div>
        <div className="form-layout"><Card><DemoForm /></Card><div className="form-examples">
          <Card><h3 style={{ marginTop: 0 }}>Representative field states</h3><div className="showcase-stack" style={{ marginTop: "1.5rem" }}>
            <TextField id="sample-input" label="Default field" placeholder="Sample text" hint="Visible label and descriptive help text." />
            <TextField id="sample-error" label="Validation error sample" defaultValue="sample" error="Demo error: enter a longer value." />
            <TextField id="sample-disabled" label="Disabled field" defaultValue="Unavailable demo input" disabled />
          </div></Card>
          <div data-theme="dark" className="card"><TextField id="dark-input" label="Field on navy" placeholder="Sample text" hint="The same component uses dark surface tokens." /></div>
        </div></div>
      </Section>
      <Section id="navigation" aria-labelledby="navigation-title" style={{ background: "var(--surface)" }}>
        <div className="section-heading"><div><span className="eyebrow">04 / Navigation</span><h2 id="navigation-title">One consistent structure.</h2><p>Navbar and Footer links point to the demo destinations below. They do not represent implemented business pages.</p></div><Badge>Demo destinations</Badge></div>
        <div className="demo-destinations">{demoLinks.map(link => <div key={link.label} id={link.href.slice(1)} className="demo-destination" tabIndex={-1}>
          <Badge>Demo only</Badge><h3>{link.label}</h3><p>Navigation target within the design-system preview.</p>
        </div>)}</div>
      </Section>
    </main>
    <Footer links={demoLinks} wordmarkHref="/design-system" demo />
  </>;
}
