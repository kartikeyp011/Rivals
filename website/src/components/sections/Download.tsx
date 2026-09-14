import Reveal from "@/components/Reveal";
import StoreButtons from "@/components/StoreButtons";

export default function Download() {
  return (
    <section
      className="section"
      id="download"
      aria-labelledby="download-heading"
      style={{ background: "var(--bg-soft)" }}
    >
      <div className="container" style={{ textAlign: "center" }}>
        <Reveal className="section-head center">
          <span className="eyebrow">Availability</span>
          <h2 id="download-heading">Rivals is coming soon</h2>
          <p className="lead" style={{ margin: "0 auto" }}>
            Rivals will be available on iOS and Android. Store listings will
            go live shortly — check back here for direct links.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <StoreButtons />
        </Reveal>

        <Reveal delay={160}>
          <p style={{ marginTop: 28, fontSize: "0.9rem" }}>
            Questions in the meantime?{" "}
            <a
              href="mailto:kartikeyp011@gmail.com"
              style={{ color: "var(--warm)", fontWeight: 600 }}
            >
              kartikeyp011@gmail.com
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
