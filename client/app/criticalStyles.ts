// Critical inline styles keep the dashboard usable if a dev-server CSS chunk is stale or missed.
export const criticalStyles = `
  html, body { margin: 0; min-height: 100%; background: #f8fafc; color: #111827; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  * { box-sizing: border-box; }
  a { color: inherit; text-decoration: none; }
  button, input, select, textarea { font: inherit; }
  img, svg { display: block; max-width: 100%; }
  table { border-collapse: collapse; width: 100%; }
  .min-h-screen { min-height: 100vh; }
  .fixed { position: fixed; }
  .sticky { position: sticky; }
  .inset-y-0 { top: 0; bottom: 0; }
  .left-0 { left: 0; }
  .top-0 { top: 0; }
  .z-10 { z-index: 10; }
  .hidden { display: none; }
  .block { display: block; }
  .inline-block { display: inline-block; }
  .flex { display: flex; }
  .inline-flex { display: inline-flex; }
  .grid { display: grid; }
  .flex-col { flex-direction: column; }
  .flex-wrap { flex-wrap: wrap; }
  .items-center { align-items: center; }
  .items-start { align-items: flex-start; }
  .justify-center { justify-content: center; }
  .justify-between { justify-content: space-between; }
  .gap-1 { gap: .25rem; }
  .gap-2 { gap: .5rem; }
  .gap-3 { gap: .75rem; }
  .gap-4 { gap: 1rem; }
  .mx-auto { margin-left: auto; margin-right: auto; }
  .mt-1 { margin-top: .25rem; }
  .mt-2 { margin-top: .5rem; }
  .mt-3 { margin-top: .75rem; }
  .mt-4 { margin-top: 1rem; }
  .mt-5 { margin-top: 1.25rem; }
  .mb-3 { margin-bottom: .75rem; }
  .w-4 { width: 1rem; }
  .w-5 { width: 1.25rem; }
  .w-10 { width: 2.5rem; }
  .w-72 { width: 18rem; }
  .w-full { width: 100%; }
  .h-4 { height: 1rem; }
  .h-5 { height: 1.25rem; }
  .h-10 { height: 2.5rem; }
  .h-44 { height: 11rem; }
  .min-h-44 { min-height: 11rem; }
  .min-w-full { min-width: 100%; }
  .max-w-md { max-width: 28rem; }
  .max-w-3xl { max-width: 48rem; }
  .max-w-7xl { max-width: 80rem; }
  .max-h-\\[70vh\\] { max-height: 70vh; }
  .space-y-1 > :not([hidden]) ~ :not([hidden]) { margin-top: .25rem; }
  .space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: .5rem; }
  .space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: .75rem; }
  .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; }
  .space-y-5 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.25rem; }
  .space-y-6 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.5rem; }
  .overflow-auto { overflow: auto; }
  .overflow-hidden { overflow: hidden; }
  .overflow-x-auto { overflow-x: auto; }
  .rounded-md { border-radius: .375rem; }
  .rounded-lg { border-radius: .5rem; }
  .border { border: 1px solid #e2e8f0; }
  .border-b { border-bottom: 1px solid #e2e8f0; }
  .border-r { border-right: 1px solid #e2e8f0; }
  .border-dashed { border-style: dashed; }
  .border-slate-100 { border-color: #f1f5f9; }
  .border-slate-200 { border-color: #e2e8f0; }
  .border-slate-300 { border-color: #cbd5e1; }
  .border-red-200 { border-color: #fecaca; }
  .border-emerald-200 { border-color: #a7f3d0; }
  .border-amber-200 { border-color: #fde68a; }
  .border-orange-200 { border-color: #fed7aa; }
  .border-sky-200 { border-color: #bae6fd; }
  .border-indigo-200 { border-color: #c7d2fe; }
  .border-yellow-200 { border-color: #fef08a; }
  .bg-white { background: #fff; }
  .bg-white\\/95 { background: rgba(255,255,255,.95); }
  .bg-slate-50 { background: #f8fafc; }
  .bg-slate-100 { background: #f1f5f9; }
  .bg-slate-900 { background: #0f172a; }
  .bg-slate-950 { background: #020617; }
  .bg-signal { background: #0f766e; }
  .bg-red-50 { background: #fef2f2; }
  .bg-red-100 { background: #fee2e2; }
  .bg-emerald-50 { background: #ecfdf5; }
  .bg-emerald-100 { background: #d1fae5; }
  .bg-amber-100 { background: #fef3c7; }
  .bg-orange-100 { background: #ffedd5; }
  .bg-sky-100 { background: #e0f2fe; }
  .bg-indigo-100 { background: #e0e7ff; }
  .bg-yellow-100 { background: #fef9c3; }
  .p-3 { padding: .75rem; }
  .p-4 { padding: 1rem; }
  .p-5 { padding: 1.25rem; }
  .p-6 { padding: 1.5rem; }
  .p-8 { padding: 2rem; }
  .px-2 { padding-left: .5rem; padding-right: .5rem; }
  .px-3 { padding-left: .75rem; padding-right: .75rem; }
  .px-4 { padding-left: 1rem; padding-right: 1rem; }
  .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
  .py-1 { padding-top: .25rem; padding-bottom: .25rem; }
  .py-2 { padding-top: .5rem; padding-bottom: .5rem; }
  .py-3 { padding-top: .75rem; padding-bottom: .75rem; }
  .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
  .py-5 { padding-top: 1.25rem; padding-bottom: 1.25rem; }
  .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
  .text-left { text-align: left; }
  .text-center { text-align: center; }
  .align-top { vertical-align: top; }
  .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  .text-xs { font-size: .75rem; line-height: 1rem; }
  .text-sm { font-size: .875rem; line-height: 1.25rem; }
  .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
  .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
  .text-2xl { font-size: 1.5rem; line-height: 2rem; }
  .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
  .font-medium { font-weight: 500; }
  .font-semibold { font-weight: 600; }
  .font-bold { font-weight: 700; }
  .uppercase { text-transform: uppercase; }
  .tracking-wide { letter-spacing: .025em; }
  .text-white { color: #fff; }
  .text-ink { color: #111827; }
  .text-signal { color: #0f766e; }
  .text-slate-100 { color: #f1f5f9; }
  .text-slate-500 { color: #64748b; }
  .text-slate-600 { color: #475569; }
  .text-slate-700 { color: #334155; }
  .text-slate-800 { color: #1e293b; }
  .text-red-700 { color: #b91c1c; }
  .text-red-800 { color: #991b1b; }
  .text-emerald-800 { color: #065f46; }
  .text-emerald-900 { color: #064e3b; }
  .text-emerald-950 { color: #022c22; }
  .text-amber-800 { color: #92400e; }
  .text-orange-800 { color: #9a3412; }
  .text-sky-800 { color: #075985; }
  .text-indigo-800 { color: #3730a3; }
  .text-yellow-800 { color: #854d0e; }
  .underline { text-decoration: underline; }
  .shadow-soft { box-shadow: 0 14px 40px rgba(15, 23, 42, .08); }
  .object-contain { object-fit: contain; }
  .divide-y > :not([hidden]) ~ :not([hidden]) { border-top: 1px solid #e2e8f0; }
  .divide-slate-100 > :not([hidden]) ~ :not([hidden]) { border-color: #f1f5f9; }
  .divide-slate-200 > :not([hidden]) ~ :not([hidden]) { border-color: #e2e8f0; }
  .line-clamp-3, .line-clamp-4 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; }
  .line-clamp-3 { -webkit-line-clamp: 3; }
  .line-clamp-4 { -webkit-line-clamp: 4; }
  .hover\\:bg-slate-50:hover { background: #f8fafc; }
  .hover\\:bg-slate-100:hover { background: #f1f5f9; }
  .hover\\:bg-teal-800:hover { background: #115e59; }
  .hover\\:underline:hover { text-decoration: underline; }
  .transition-colors { transition: color .15s, background-color .15s, border-color .15s; }
  .transition-shadow { transition: box-shadow .2s; }
  .duration-150 { transition-duration: .15s; }
  .duration-200 { transition-duration: .2s; }
  .ant-btn { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; border-radius: .375rem; border: 1px solid #d9d9d9; background: #fff; padding: .45rem .9rem; font-weight: 600; }
  .ant-btn-primary { background: #0f766e; border-color: #0f766e; color: #fff; }
  .ant-skeleton-title, .ant-skeleton-paragraph li { display: block; height: 1rem; border-radius: .25rem; background: linear-gradient(90deg,#f1f5f9,#e2e8f0,#f1f5f9); }
  .ant-skeleton-paragraph { list-style: none; padding: 0; margin: 1rem 0 0; }
  .ant-skeleton-paragraph li + li { margin-top: .75rem; }
  @media (min-width: 640px) {
    .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .sm\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .sm\\:flex-row { flex-direction: row; }
    .sm\\:items-center { align-items: center; }
    .sm\\:justify-between { justify-content: space-between; }
    .sm\\:px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
  }
  @media (min-width: 1024px) {
    .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .lg\\:flex-row { flex-direction: row; }
    .lg\\:items-center { align-items: center; }
    .lg\\:items-start { align-items: flex-start; }
    .lg\\:justify-between { justify-content: space-between; }
    .lg\\:px-8 { padding-left: 2rem; padding-right: 2rem; }
  }
  @media (min-width: 1280px) {
    .xl\\:block { display: block; }
    .xl\\:hidden { display: none; }
    .xl\\:pl-72 { padding-left: 18rem; }
    .xl\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }
`;
