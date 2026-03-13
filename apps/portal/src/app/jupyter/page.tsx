export default function JupyterPage() {
  return (
    <div className="h-full w-full flex flex-col">
      <header className="p-6 bg-white border-b shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Jupyter Workspace</h1>
        <p className="text-sm text-slate-500">Connected to mimer-cluster</p>
      </header>
      
      {/* The iframe embedding your local Jupyter tunnel */}
      <div className="flex-1 bg-slate-100">
        <iframe 
          src="http://localhost:8080" 
          className="w-full h-full border-none"
          title="Jupyter Notebook"
        />
      </div>
    </div>
  );
}