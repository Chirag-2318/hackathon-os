// A clean, bold sans heading with one phrase in a vivid blue-to-violet gradient. It is a deliberate exception to the
// page's italic-ending rule and is used where a section wants this cleaner look (the How it works header).
type VividHeadingProps = {
  as?: 'h1' | 'h2' | 'h3';
  id?: string;
  lead: string;     // the plain part, for example "From kickoff to submission,"
  vivid: string;    // the gradient phrase, for example "on one clock."
  className?: string;
};

export function VividHeading({ as: Tag = 'h2', id, lead, vivid, className = '' }: VividHeadingProps) {
  return (
    <Tag id={id} className={`l-vivid ${className}`.trim()}>
      {lead} <span className="l-vivid-em">{vivid}</span>
    </Tag>
  );
}
