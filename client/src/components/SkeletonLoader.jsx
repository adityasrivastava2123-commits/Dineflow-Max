function Bone({ className }) {
  return (
    <div
      className={`bg-stone-200 rounded animate-pulse ${className}`}
    />
  );
}

export function MenuItemSkeleton() {
  return (
    <div className="flex gap-3 py-4 border-b border-stone-100">
      <div className="flex-1 space-y-2">
        <Bone className="h-3 w-8" />
        <Bone className="h-4 w-3/4" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <Bone className="h-5 w-16" />
          <Bone className="h-8 w-20 rounded-xl" />
        </div>
      </div>
      <Bone className="w-24 h-24 rounded-xl flex-shrink-0" />
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="card space-y-3">
      <div className="flex justify-between">
        <Bone className="h-4 w-24" />
        <Bone className="h-5 w-16 rounded-full" />
      </div>
      <Bone className="h-3 w-32" />
      <div className="space-y-2">
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-3/4" />
      </div>
      <div className="flex justify-between pt-1">
        <Bone className="h-5 w-20" />
        <Bone className="h-8 w-24 rounded-xl" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Bone className="h-3 w-24" />
          <Bone className="h-7 w-28" />
        </div>
        <Bone className="w-10 h-10 rounded-xl" />
      </div>
      <Bone className="h-3 w-24 mt-3" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-stone-100">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Bone className="h-3 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-stone-50">
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j} className="px-4 py-3">
                  <Bone className={`h-3 ${j === 0 ? 'w-32' : 'w-20'}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CategorySkeleton({ count = 6 }) {
  return (
    <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hide">
      {Array.from({ length: count }).map((_, i) => (
        <Bone key={i} className="h-8 w-20 rounded-full flex-shrink-0" />
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 200 }) {
  return (
    <div className="relative" style={{ height }}>
      <div className="absolute inset-0 flex items-end gap-2 px-4 pb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-stone-200 animate-pulse rounded-t"
            style={{ height: `${30 + Math.random() * 70}%`, animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// Default export: generic page skeleton
export default function SkeletonLoader({ type = 'menu', count = 4 }) {
  switch (type) {
    case 'menu':
      return (
        <>
          {Array.from({ length: count }).map((_, i) => (
            <MenuItemSkeleton key={i} />
          ))}
        </>
      );
    case 'orders':
      return (
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      );
    case 'stats':
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      );
    default:
      return (
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <Bone key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      );
  }
}
