import Image from "next/image"

import LogoImage from "@/media/Logo.png"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 40, className }: LogoProps) {
  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-lg", className)}
      style={{ width: size, height: size }}
    >
      {/* Inner wrapper extends 2px past each edge so the outer overflow-hidden box
          crops that margin off the source image, trimming its own faint border. */}
      <div className="absolute -inset-0.5">
        <Image
          src={LogoImage}
          alt="MyCampus360"
          fill
          sizes={`${size}px`}
          className="object-cover"
          priority
        />
      </div>
    </div>
  )
}
