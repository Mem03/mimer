import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-brand-dark text-slate-700 flex flex-col border-r border-slate-800">
      <div className="h-16 flex items-center px-5 border-b border-slate-800 gap-2.5">
        <div className="w-7 h-7 rounded-md bg-brand-primary flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <div>
          <p className="text-l text-slate-400 font-bold text-sm leading-none tracking-wide">Mimer</p>
          <p className="text-slate-400 text-xs leading-none mt-1">Data Platform</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
        <div>
          <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Data Management
          </h3>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                Data Catalog
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Compute & Analysis
          </h3>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/compute" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
                Compute Clusters
              </Link>
            </li>
            <li>
              <Link href="/jupyter" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                Jupyter Workspace
              </Link>
            </li>
            <li>
              <Link href="/editor" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Code Editor
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Platform Health
          </h3>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/monitoring" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Monitoring
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Configuration
          </h3>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Settings
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}