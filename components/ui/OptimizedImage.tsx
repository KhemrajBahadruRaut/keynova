import Image, { type ImageProps } from "next/image";

import { canOptimizeImage } from "@/lib/image-optimization";

export default function OptimizedImage({
  src,
  quality = 75,
  unoptimized,
  ...props
}: ImageProps) {
  return (
    <Image
      {...props}
      src={src}
      quality={quality}
      unoptimized={unoptimized ?? (typeof src === "string" && !canOptimizeImage(src))}
    />
  );
}
