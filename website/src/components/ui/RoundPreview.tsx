type Round = "word" | "cipher" | "number";

type Props = {
  round: Round;
  roundNum: string;
  tag: string;
  title: string;
  description: string;
  maxScore: string;
};

export default function RoundPreview({
  round,
  roundNum,
  tag,
  title,
  description,
  maxScore,
}: Props) {
  return (
    <article className="round-preview" data-round={round}>
      <div className="round-preview-top">
        <span className="rnum">{roundNum}</span>
        <span className="rtag">{tag}</span>
      </div>

      <div className="round-preview-body">
        <h3>{title}</h3>
        <p>{description}</p>

        {round === "word" && (
          <div className="mini-word" aria-hidden="true">
            <div className="word-row">
              <div className="word-cell hit">R</div>
              <div className="word-cell filled">A</div>
              <div className="word-cell miss">T</div>
              <div className="word-cell near">E</div>
              <div className="word-cell filled">S</div>
            </div>
            <div className="word-row">
              <div className="word-cell filled">R</div>
              <div className="word-cell near">O</div>
              <div className="word-cell miss">B</div>
              <div className="word-cell filled">I</div>
              <div className="word-cell miss">N</div>
            </div>
            <div className="word-row">
              <div className="word-cell hit">R</div>
              <div className="word-cell hit">I</div>
              <div className="word-cell hit">V</div>
              <div className="word-cell hit">A</div>
              <div className="word-cell hit">L</div>
            </div>
          </div>
        )}

        {round === "cipher" && (
          <div className="mini-cipher" aria-hidden="true">
            <div className="cipher-code">W R I · Y H V</div>
            <div className="cipher-key">
              <span>W=A</span>
              <span>R=B</span>
              <span>I=C</span>
              <span>·</span>
              <span>Y=E</span>
              <span>H=F</span>
              <span>V=I</span>
            </div>
          </div>
        )}

        {round === "number" && (
          <div className="mini-number" aria-hidden="true">
            <div className="num-seq">
              <span>2</span>
              <span>6</span>
              <span>12</span>
              <span>20</span>
              <span className="next">?</span>
            </div>
            <div className="num-hint">What comes next?</div>
          </div>
        )}
      </div>

      <div className="round-preview-foot">
        <span>Round scoring</span>
        <span className="score-max">Max {maxScore}</span>
      </div>
    </article>
  );
}
