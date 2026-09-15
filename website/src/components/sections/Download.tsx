import Reveal from "@/components/Reveal";
import StoreButtons from "@/components/ui/StoreButtons";

export default function Download() {
  return (
    <section className="section section-download-vs" id="download" aria-labelledby="download-heading">
      <div className="vs-split-container">
        <div className="vs-side vs-left">
          <div className="vs-content">
            <div className="vs-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
              </svg>
            </div>
            <h3>APPLE iOS</h3>
            <div className="vs-btn">App Store <span className="badge">COMING SOON</span></div>
          </div>
        </div>
        <div className="vs-side vs-right">
          <div className="vs-content">
            <div className="vs-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4483-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0004.5511-.4482.9997-.9993.9997zm-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997zm11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.022 3.503C15.6963 8.3093 13.915 7.848 12 7.848c-1.9146 0-3.6959.4613-5.1371 1.1017l-2.022-3.503a.4155.4155 0 00-.5676-.1521.4155.4155 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3436-4.1021-2.6892-7.5743-6.1185-9.4396z"/>
              </svg>
            </div>
            <h3>ANDROID</h3>
            <div className="vs-btn">Galaxy Store <span className="badge">COMING SOON</span></div>
          </div>
        </div>
        <div className="vs-center-mark">VS</div>
        <div className="vs-title-overlay">
          <Reveal>
            <h2 id="download-heading">CHOOSE YOUR PLATFORM.<br/>PREPARE FOR BATTLE.</h2>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
