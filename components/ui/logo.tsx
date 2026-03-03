import Image from "next/image"
import Link from "next/link"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  href?: string
  className?: string
}

export function Logo({ size = "md", showText = true, href = "/", className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-20",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  }

  const LogoContent = () => (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/images/logo.png"
        alt="INTECO & WIE Logo"
        width={80}
        height={80}
        className={`${sizeClasses[size]} w-auto mr-3`}
      />
      {showText && (
        <span
          className={`font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent ${textSizeClasses[size]}`}
        >
          INTECO & WIE
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="flex items-center hover:opacity-80 transition-opacity">
        <LogoContent />
      </Link>
    )
  }

  return <LogoContent />
}
