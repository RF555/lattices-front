interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
}

export function OptimizedImage({
  src,
  alt,
  fallback = '/placeholder.svg',
  ...props
}: OptimizedImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        (e.target as HTMLImageElement).src = fallback;
      }}
      {...props}
    />
  );
}
