import type { MuscleKey } from "@/lib/train-data";

const OFF = "#332c22";
const ON = "#c97052";
const OUTLINE = "#26211a";

function fill(active: boolean) {
  return active ? ON : OFF;
}

export function MuscleFigure({ highlighted }: { highlighted: MuscleKey[] }) {
  const has = (k: MuscleKey) => highlighted.includes(k);

  return (
    <svg viewBox="0 0 100 200" className="w-full h-full" aria-hidden>
      {/* head + neck */}
      <circle cx="50" cy="16" r="11" fill={OFF} stroke={OUTLINE} strokeWidth="1" />
      <rect x="45" y="25" width="10" height="9" rx="3" fill={OFF} />

      {/* upper back / traps (peeking above shoulders) */}
      <path d="M 34 30 Q 50 24 66 30 L 62 38 Q 50 34 38 38 Z" fill={fill(has("upperBack"))} />

      {/* torso base silhouette */}
      <path
        d="M 30 40 Q 50 34 70 40 L 74 96 Q 50 104 26 96 Z"
        fill="#29292f"
        stroke={OUTLINE}
        strokeWidth="1"
      />

      {/* rear delts (outer shoulder edge) */}
      <ellipse cx="24" cy="42" rx="6" ry="8" fill={fill(has("rearDelts"))} />
      <ellipse cx="76" cy="42" rx="6" ry="8" fill={fill(has("rearDelts"))} />

      {/* front delts */}
      <circle cx="27" cy="41" r="8" fill={fill(has("frontDelts"))} />
      <circle cx="73" cy="41" r="8" fill={fill(has("frontDelts"))} />

      {/* lats (sides of torso) */}
      <path d="M 30 46 Q 24 66 28 88 L 36 84 Q 33 62 36 48 Z" fill={fill(has("lats"))} />
      <path d="M 70 46 Q 76 66 72 88 L 64 84 Q 67 62 64 48 Z" fill={fill(has("lats"))} />

      {/* chest */}
      <ellipse cx="39" cy="53" rx="11" ry="9" fill={fill(has("chest"))} />
      <ellipse cx="61" cy="53" rx="11" ry="9" fill={fill(has("chest"))} />

      {/* obliques */}
      <rect x="28" y="70" width="7" height="20" rx="3" fill={fill(has("obliques"))} />
      <rect x="65" y="70" width="7" height="20" rx="3" fill={fill(has("obliques"))} />

      {/* abs */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="43" y={66 + i * 10} width="6.5" height="8" rx="2" fill={fill(has("abs"))} />
          <rect x="50.5" y={66 + i * 10} width="6.5" height="8" rx="2" fill={fill(has("abs"))} />
        </g>
      ))}

      {/* biceps / triceps (upper arms) */}
      <ellipse cx="20" cy="60" rx="6.5" ry="14" fill={fill(has("biceps") || has("triceps"))} />
      <ellipse cx="80" cy="60" rx="6.5" ry="14" fill={fill(has("biceps") || has("triceps"))} />

      {/* forearms (never highlighted, kept muted) */}
      <ellipse cx="17" cy="86" rx="5" ry="11" fill={OFF} />
      <ellipse cx="83" cy="86" rx="5" ry="11" fill={OFF} />

      {/* glutes / hip */}
      <path d="M 32 96 Q 50 102 68 96 L 66 108 Q 50 112 34 108 Z" fill={fill(has("glutes"))} />

      {/* quads */}
      <ellipse cx="40" cy="132" rx="9" ry="20" fill={fill(has("quads"))} />
      <ellipse cx="60" cy="132" rx="9" ry="20" fill={fill(has("quads"))} />

      {/* hamstrings (inner-thigh accent) */}
      <ellipse cx="40" cy="140" rx="4" ry="12" fill={fill(has("hams"))} opacity="0.85" />
      <ellipse cx="60" cy="140" rx="4" ry="12" fill={fill(has("hams"))} opacity="0.85" />

      {/* calves */}
      <ellipse cx="40" cy="172" rx="6.5" ry="15" fill={fill(has("calves"))} />
      <ellipse cx="60" cy="172" rx="6.5" ry="15" fill={fill(has("calves"))} />
    </svg>
  );
}

export function PulseFigure() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden>
      <circle cx="50" cy="50" r="34" fill="none" stroke="#c97052" strokeWidth="2" opacity="0.35" />
      <path
        d="M 12 52 L 32 52 L 40 34 L 50 68 L 58 44 L 64 52 L 88 52"
        fill="none"
        stroke="#c97052"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
