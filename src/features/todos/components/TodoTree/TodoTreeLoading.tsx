// Fix H4: Deterministic widths instead of Math.random() in render
const SKELETON_WIDTHS = [65, 40, 55, 35, 50];

export function TodoTreeLoading() {
  return (
    <div className="space-y-2 animate-pulse">
      {SKELETON_WIDTHS.map((width, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-2">
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded" style={{ width: `${width}%` }} />
        </div>
      ))}
    </div>
  );
}
