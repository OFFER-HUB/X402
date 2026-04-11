export const Logo = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 148 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Metered"
      {...props}
    >
      {/* M lettermark */}
      <path
        d="M2 28V8H7.5L14 21L20.5 8H26V28H21V16L14.5 27.5L8 16V28H2Z"
        fill="white"
      />
      {/* Wordmark: "etered" — text element guarantees correct spelling */}
      <text
        x="32"
        y="27"
        fontFamily="'JetBrains Mono', 'Fira Code', monospace"
        fontSize="19"
        fontWeight="300"
        letterSpacing="0.5"
        fill="white"
        opacity="0.9"
      >
        etered
      </text>
    </svg>
  )
}
