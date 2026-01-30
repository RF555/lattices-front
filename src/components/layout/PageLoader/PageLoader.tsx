interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[400px]"
      role="status"
      aria-live="polite"
    >
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
      <p className="mt-4 text-sm text-gray-600">{message}</p>
    </div>
  );
}
