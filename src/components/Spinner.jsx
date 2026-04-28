function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 text-slate-600">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}

export default Spinner