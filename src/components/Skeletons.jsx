import React from 'react';

export function SkeletonBox({ className = '' }) {
  return (
    <div
      className={`skeleton-shimmer rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
}

// 1. Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-4 pb-6 animate-in fade-in duration-200">
      {/* Timeframe pill skeleton */}
      <div className="flex items-center justify-between gap-2">
        <SkeletonBox className="h-9 w-40 rounded-2xl" />
        <SkeletonBox className="h-9 w-24 rounded-2xl" />
      </div>

      {/* Main Metric Cards Grid (2x2) */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <SkeletonBox className="h-4 w-16" />
              <SkeletonBox className="w-8 h-8 rounded-xl" />
            </div>
            <SkeletonBox className="h-7 w-28 rounded-lg" />
            <SkeletonBox className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Chart Card Skeleton */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <SkeletonBox className="h-4 w-32" />
            <SkeletonBox className="h-3 w-48" />
          </div>
          <SkeletonBox className="h-7 w-20 rounded-xl" />
        </div>
        <div className="h-44 flex items-end gap-2 pt-6 px-2">
          {[40, 75, 55, 90, 65, 80, 50].map((h, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <SkeletonBox className="w-full rounded-t-lg" style={{ height: `${h}%` }} />
              <SkeletonBox className="h-2.5 w-6 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Shortcuts Skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <SkeletonBox className="h-20 rounded-3xl" />
        <SkeletonBox className="h-20 rounded-3xl" />
      </div>
    </div>
  );
}

// 2. Products List Skeleton
export function ProductsSkeleton() {
  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      {/* Category Pills Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <SkeletonBox className="h-8 w-20 rounded-full shrink-0" />
        <SkeletonBox className="h-8 w-24 rounded-full shrink-0" />
        <SkeletonBox className="h-8 w-28 rounded-full shrink-0" />
        <SkeletonBox className="h-8 w-20 rounded-full shrink-0" />
      </div>

      {/* Product Cards List */}
      <div className="space-y-2.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <SkeletonBox className="w-12 h-12 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <SkeletonBox className="h-4 w-3/4 max-w-[200px]" />
                <div className="flex items-center gap-2">
                  <SkeletonBox className="h-4 w-20 rounded" />
                  <SkeletonBox className="h-4 w-16 rounded" />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <SkeletonBox className="h-5 w-14 rounded" />
              <div className="flex items-center gap-1.5">
                <SkeletonBox className="w-7 h-7 rounded-lg" />
                <SkeletonBox className="w-7 h-7 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. Invoices List Skeleton
export function InvoicesSkeleton() {
  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* Date / Status Pills Skeleton */}
      <div className="flex items-center gap-2 pb-1">
        <SkeletonBox className="h-8 w-20 rounded-full" />
        <SkeletonBox className="h-8 w-24 rounded-full" />
        <SkeletonBox className="h-8 w-24 rounded-full" />
      </div>

      {/* Invoice Cards */}
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <SkeletonBox className="w-9 h-9 rounded-xl shrink-0" />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <SkeletonBox className="h-4 w-24" />
                  <SkeletonBox className="h-4 w-12 rounded" />
                </div>
                <SkeletonBox className="h-3 w-32" />
              </div>
            </div>
            <SkeletonBox className="h-6 w-16 rounded-lg" />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <SkeletonBox className="h-4 w-28" />
            <div className="flex items-center gap-2">
              <SkeletonBox className="h-8 w-16 rounded-xl" />
              <SkeletonBox className="h-8 w-16 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 4. POS Billing Screen Inventory Skeleton
export function BillingInventorySkeleton() {
  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <SkeletonBox className="h-7 w-20 rounded-xl shrink-0" />
        <SkeletonBox className="h-7 w-24 rounded-xl shrink-0" />
        <SkeletonBox className="h-7 w-20 rounded-xl shrink-0" />
        <SkeletonBox className="h-7 w-28 rounded-xl shrink-0" />
      </div>

      {/* Product Grid / Row Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <SkeletonBox className="h-3.5 w-full rounded" />
              <SkeletonBox className="h-2.5 w-2/3 rounded" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <SkeletonBox className="h-5 w-12 rounded" />
              <SkeletonBox className="h-7 w-7 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 5. Categories List Skeleton
export function CategoriesSkeleton() {
  return (
    <div className="space-y-2.5 animate-in fade-in duration-200">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <SkeletonBox className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-1.5">
              <SkeletonBox className="h-4 w-32" />
              <SkeletonBox className="h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBox className="w-8 h-8 rounded-xl" />
            <SkeletonBox className="w-8 h-8 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// 6. Employees List Skeleton
export function EmployeesSkeleton() {
  return (
    <div className="space-y-2.5 animate-in fade-in duration-200">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3.5">
            <SkeletonBox className="w-12 h-12 rounded-2xl shrink-0" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <SkeletonBox className="h-4 w-28" />
                <SkeletonBox className="h-4 w-14 rounded-full" />
              </div>
              <SkeletonBox className="h-3 w-36" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBox className="w-8 h-8 rounded-xl" />
            <SkeletonBox className="w-8 h-8 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

// 7. Payment Modes Skeleton
export function PaymentModesSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Suggestions box skeleton */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
        <SkeletonBox className="h-4 w-48" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonBox key={i} className="h-8 w-24 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Active modes list skeleton */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
        <SkeletonBox className="h-4 w-40" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-3 rounded-2xl border border-slate-100 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <SkeletonBox className="w-9 h-9 rounded-xl shrink-0" />
                <div className="space-y-1">
                  <SkeletonBox className="h-3.5 w-24" />
                  <SkeletonBox className="h-2.5 w-16" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SkeletonBox className="h-7 w-16 rounded-lg" />
                <SkeletonBox className="w-7 h-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 8. Store Profile Skeleton
export function ProfileSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <SkeletonBox className="w-14 h-14 rounded-2xl shrink-0" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SkeletonBox className="h-5 w-32" />
              <SkeletonBox className="h-4 w-16 rounded-full" />
            </div>
            <SkeletonBox className="h-3.5 w-40" />
            <SkeletonBox className="h-3 w-20" />
          </div>
        </div>
        <SkeletonBox className="h-8 w-16 rounded-xl shrink-0" />
      </div>

      {/* Store Shortcuts List */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs space-y-2">
        <SkeletonBox className="h-3.5 w-44 mb-3" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100"
          >
            <div className="flex items-center gap-3">
              <SkeletonBox className="w-8 h-8 rounded-xl shrink-0" />
              <div className="space-y-1">
                <SkeletonBox className="h-3.5 w-36" />
                <SkeletonBox className="h-2.5 w-48" />
              </div>
            </div>
            <SkeletonBox className="w-4 h-4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// 9. Generic Form Skeleton (ProductForm, CategoryForm, EmployeeForm)
export function FormSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4 animate-in fade-in duration-200">
      <div className="space-y-1.5">
        <SkeletonBox className="h-3 w-24" />
        <SkeletonBox className="h-10 w-full rounded-xl" />
      </div>

      <div className="space-y-1.5">
        <SkeletonBox className="h-3 w-32" />
        <SkeletonBox className="h-10 w-full rounded-xl" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-10 w-full rounded-xl" />
        </div>
      </div>

      <div className="space-y-1.5">
        <SkeletonBox className="h-3 w-28" />
        <SkeletonBox className="h-20 w-full rounded-xl" />
      </div>

      <div className="pt-2 flex gap-2">
        <SkeletonBox className="h-11 w-1/3 rounded-xl" />
        <SkeletonBox className="h-11 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

// 10. Bill Settings Skeleton
export function BillSettingsSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <SkeletonBox className="h-11 w-full rounded-2xl" />
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
        <SkeletonBox className="h-4 w-40" />
        <div className="space-y-3">
          <SkeletonBox className="h-10 w-full rounded-xl" />
          <SkeletonBox className="h-10 w-full rounded-xl" />
          <SkeletonBox className="h-10 w-full rounded-xl" />
        </div>
        <SkeletonBox className="h-11 w-full rounded-xl pt-2" />
      </div>
    </div>
  );
}

// 11. Subscription Plans Skeleton
export function SubscriptionSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Current License Skeleton */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <SkeletonBox className="h-4 w-36" />
          <SkeletonBox className="h-5 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <SkeletonBox className="h-14 rounded-2xl" />
          <SkeletonBox className="h-14 rounded-2xl" />
        </div>
      </div>

      {/* Plans Grid Skeleton */}
      <div className="space-y-3">
        <SkeletonBox className="h-4 w-44" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3"
            >
              <div className="flex justify-between items-center">
                <SkeletonBox className="h-5 w-28" />
                <SkeletonBox className="h-4 w-12" />
              </div>
              <SkeletonBox className="h-8 w-24" />
              <div className="space-y-2 pt-2">
                <SkeletonBox className="h-3 w-full" />
                <SkeletonBox className="h-3 w-5/6" />
                <SkeletonBox className="h-3 w-4/6" />
              </div>
              <SkeletonBox className="h-11 w-full rounded-2xl mt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
