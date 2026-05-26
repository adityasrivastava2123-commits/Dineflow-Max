const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    classes: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    pulse: true,
  },
  accepted: {
    label: 'Accepted',
    classes: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    pulse: false,
  },
  preparing: {
    label: 'Preparing',
    classes: 'bg-orange-100 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
    pulse: true,
  },
  ready: {
    label: 'Ready',
    classes: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    pulse: false,
  },
  delivered: {
    label: 'Delivered',
    classes: 'bg-stone-100 text-stone-600 border-stone-200',
    dot: 'bg-stone-400',
    pulse: false,
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-red-100 text-red-600 border-red-200',
    dot: 'bg-red-500',
    pulse: false,
  },
  paid: {
    label: 'Paid',
    classes: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    pulse: false,
  },
  unpaid: {
    label: 'Unpaid',
    classes: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    pulse: false,
  },
  failed: {
    label: 'Failed',
    classes: 'bg-red-100 text-red-600 border-red-200',
    dot: 'bg-red-500',
    pulse: false,
  },
  refunded: {
    label: 'Refunded',
    classes: 'bg-purple-100 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    pulse: false,
  },
};

export default function StatusBadge({ status, size = 'sm', showDot = true }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    classes: 'bg-stone-100 text-stone-600 border-stone-200',
    dot: 'bg-stone-400',
    pulse: false,
  };

  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-wide
                  ${config.classes} ${sizeClasses[size] || sizeClasses.sm}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot} ${
            config.pulse ? 'animate-pulse' : ''
          }`}
        />
      )}
      {config.label}
    </span>
  );
}
