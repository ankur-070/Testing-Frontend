function FileDropzone({ file, onFileSelect, previewUrl }) {
  function handleFile(nextFile) {
    if (nextFile) onFileSelect(nextFile)
  }

  function handleDrop(event) {
    event.preventDefault()
    handleFile(event.dataTransfer.files?.[0] ?? null)
  }

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center"
    >
      <input
        id="image"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
      />

      <label htmlFor="image" className="block cursor-pointer">
        <span className="text-sm font-semibold text-slate-800">
          Drag and drop an image here
        </span>
        <p className="mt-2 text-sm text-slate-500">
          or click to choose a file (JPG, PNG, WEBP, GIF)
        </p>
      </label>

      {file && (
        <p className="mt-4 text-sm text-slate-700">
          Selected: <span className="font-semibold">{file.name}</span>
        </p>
      )}

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Selected preview"
          className="mx-auto mt-4 h-48 w-full max-w-md rounded-xl object-cover shadow-sm"
        />
      )}
    </div>
  )
}

export default FileDropzone