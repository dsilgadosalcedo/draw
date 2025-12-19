export default function Connecting() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="relative flex items-center justify-center w-32 h-32">
        {/* Multiple animated pulsing circles for signal effect */}
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-scale" />
        <div className="absolute inset-0 rounded-full bg-primary/15 animate-pulse-scale [animation-delay:0.33s]" />
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-scale [animation-delay:0.66s]" />
        {/* Main circle container */}
        <div className="relative z-10 flex items-center justify-center w-32 h-32 rounded-full border-2 border-primary/40 bg-background/90 backdrop-blur-sm shadow-lg">
          <span className="text-sm font-medium text-foreground">
            Connecting
          </span>
        </div>
      </div>
    </div>
  )
}
