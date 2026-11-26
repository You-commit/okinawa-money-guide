type IllustrationTopic = 'knowledge' | 'mortgage'
const source = '/article-media/nisa-questions-illustration.webp'
const boxes = [
  { x: 96, y: 175, width: 301, height: 103, cx: 247, cy: 211 },
  { x: 773, y: 175, width: 351, height: 103, cx: 949, cy: 211 },
  { x: 54, y: 464, width: 275, height: 76, cx: 192, cy: 490 },
  { x: 873, y: 451, width: 272, height: 109, cx: 1010, cy: 488 },
] as const
const messages: Record<IllustrationTopic, readonly (readonly string[])[]> = {
  knowledge: [
    ['何から学べば', 'いいのかな？'],
    ['住宅ローンは', 'どう選ぶ？'],
    ['家計を見直したい'],
    ['NISAや保険、', 'どう考えよう？'],
  ],
  mortgage: [
    ['毎月いくら', '返せるかな？'],
    ['固定と変動、', 'どちらがいい？'],
    ['諸費用はいくら？'],
    ['返済方式は', 'どう選ぶ？'],
  ],
}
export default function EditorialQuestionsIllustration({ topic }: { topic: IllustrationTopic }) {
  const lines = messages[topic]
  return (
    <figure className="editorial-questions-illustration" data-illustration-topic={topic}>
      <svg viewBox="0 0 1200 900" role="img" aria-label={lines.map(group => group.join('')).join('／')} xmlns="http://www.w3.org/2000/svg">
        {/* Use the exact approved NISA artwork. Never redraw the people or symbols. */}
        <image href={source} width="1200" height="900" />
        {boxes.map((box, index) => (
          <g key={index}>
            <rect x={box.x} y={box.y} width={box.width} height={box.height} fill="#fefefe" />
            <text x={box.cx} y={lines[index].length === 1 ? 516 : box.cy} fill="#11254e" fontFamily="var(--omg-font-sans), sans-serif" fontSize={index === 2 ? 31 : 36} fontWeight="700" textAnchor="middle">
              {lines[index].map((line, lineIndex) => <tspan key={line} x={box.cx} dy={lineIndex === 0 ? 0 : 52}>{line}</tspan>)}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  )
}
