import React from 'react'

// Skeleton primitives
const SkeletonBox = ({ className = '' }) => (
  <div className={`bg-slate-200 rounded animate-shimmer ${className}`} />
)

const SkeletonText = ({ className = '' }) => (
  <div className={`bg-slate-200 rounded h-3 animate-shimmer ${className}`} />
)

const SkeletonCircle = ({ className = '' }) => (
  <div className={`bg-slate-200 rounded-full animate-shimmer ${className}`} />
)

// Variant components
const TableSkeleton = ({ rows = 5 }) => (
  <div className="space-y-3">
    {/* Header row */}
    <div className="grid grid-cols-5 gap-4 pb-3 border-b border-slate-200">
      {[...Array(5)].map((_, i) => (
        <SkeletonText key={`header-${i}`} className="h-4" />
      ))}
    </div>
    {/* Data rows */}
    {[...Array(rows)].map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="grid grid-cols-5 gap-4 py-3">
        {[...Array(5)].map((_, colIndex) => (
          <SkeletonText key={`cell-${rowIndex}-${colIndex}`} className="h-3" />
        ))}
      </div>
    ))}
  </div>
)

const CardSkeleton = ({ columns = 3 }) => (
  <div className={`grid gap-4 ${columns === 3 ? 'grid-cols-3' : columns === 4 ? 'grid-cols-4' : 'grid-cols-2'}`}>
    {[...Array(columns)].map((_, i) => (
      <div key={`card-${i}`} className="border border-slate-200 rounded-lg p-4 space-y-3">
        <SkeletonCircle className="h-12 w-12" />
        <SkeletonText className="h-4 w-3/4" />
        <SkeletonText className="h-3 w-full" />
        <SkeletonText className="h-3 w-5/6" />
      </div>
    ))}
  </div>
)

const ListSkeleton = ({ rows = 5 }) => (
  <div className="space-y-3">
    {[...Array(rows)].map((_, i) => (
      <div key={`list-${i}`} className="border border-slate-200 rounded-lg p-4 space-y-2">
        <SkeletonText className="h-4 w-1/3" />
        <SkeletonText className="h-3 w-full" />
        <SkeletonText className="h-3 w-4/5" />
      </div>
    ))}
  </div>
)

const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Stat cards */}
    <div className="grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={`stat-${i}`} className="border border-slate-200 rounded-lg p-4 space-y-2">
          <SkeletonText className="h-3 w-1/2" />
          <SkeletonBox className="h-8 w-20" />
          <SkeletonText className="h-2 w-2/3" />
        </div>
      ))}
    </div>
    {/* Chart areas */}
    <div className="grid grid-cols-2 gap-4">
      <SkeletonBox className="h-64 rounded-lg" />
      <SkeletonBox className="h-64 rounded-lg" />
    </div>
  </div>
)

const FormSkeleton = ({ rows = 5 }) => (
  <div className="space-y-4">
    {[...Array(rows)].map((_, i) => (
      <div key={`form-${i}`} className="space-y-2">
        <SkeletonText className="h-3 w-1/4" />
        <SkeletonBox className="h-10 w-full rounded" />
      </div>
    ))}
  </div>
)

const StatsSkeleton = ({ columns = 4 }) => (
  <div className={`grid gap-4 ${columns === 4 ? 'grid-cols-4' : columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
    {[...Array(columns)].map((_, i) => (
      <div key={`stat-${i}`} className="border border-slate-200 rounded-lg p-4 space-y-2">
        <SkeletonText className="h-3 w-1/2" />
        <SkeletonBox className="h-8 w-20" />
        <SkeletonText className="h-2 w-2/3" />
      </div>
    ))}
  </div>
)

const AuthSkeleton = () => (
  <div className="flex h-screen">
    {/* Sidebar */}
    <div className="w-64 bg-slate-100 p-4 space-y-4">
      <SkeletonBox className="h-8 w-32" />
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <SkeletonBox key={`sidebar-${i}`} className="h-10 w-full rounded" />
        ))}
      </div>
    </div>
    {/* Main content */}
    <div className="flex-1 flex flex-col">
      {/* TopBar */}
      <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between">
        <SkeletonBox className="h-8 w-48" />
        <div className="flex gap-4">
          <SkeletonCircle className="h-8 w-8" />
          <SkeletonCircle className="h-8 w-8" />
        </div>
      </div>
      {/* Content area */}
      <div className="flex-1 p-6 space-y-4">
        <SkeletonBox className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonBox key={`content-${i}`} className="h-32 rounded-lg" />
          ))}
        </div>
        <SkeletonBox className="h-64 rounded-lg" />
      </div>
    </div>
  </div>
)

export default function SkeletonLoader({ 
  variant = 'list', 
  message = 'Loading...', 
  rows = 5,
  columns = 4,
  className = ''
}) {
  // Render appropriate variant
  const renderVariant = () => {
    switch (variant) {
      case 'table':
        return <TableSkeleton rows={rows} />
      case 'card':
        return <CardSkeleton columns={columns} />
      case 'list':
        return <ListSkeleton rows={rows} />
      case 'dashboard':
        return <DashboardSkeleton />
      case 'form':
        return <FormSkeleton rows={rows} />
      case 'stats':
        return <StatsSkeleton columns={columns} />
      case 'auth':
        return <AuthSkeleton />
      default:
        console.warn(`Unknown variant: ${variant}, defaulting to list`)
        return <ListSkeleton rows={rows} />
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
      className={className}
    >
      {renderVariant()}
    </div>
  )
}
