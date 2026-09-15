import Link from "next/link";

export default function NotFound() {
  return (
    <section className="not-found">
      <div className="container">
        <div className="code">404</div>
        <h1>This page doesn&apos;t exist.</h1>
        <p style={{ maxWidth: 480, margin: "0 auto 28px" }}>
          Whatever you were looking for isn&apos;t here. Let&apos;s get you back to
          something more useful.
        </p>
        <Link href="/" className="btn btn--accent btn--lg">
          Back to home
        </Link>
      </div>
    </section>
  );
}
