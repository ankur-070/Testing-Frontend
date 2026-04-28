import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl items-center">
      <div className="w-full rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
          404
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          The page you requested does not exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
