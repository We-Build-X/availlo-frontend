import { Link } from '@tanstack/react-router'

export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-neutral-800 text-white p-4 hidden md:block">
      <h2 className="text-xl font-bold mb-4">Admin</h2>
      <nav className="flex flex-col space-y-2">
        <Link
          to="/admin/dashboard"
          className="p-2 rounded-md hover:bg-neutral-700"
          activeProps={{ className: 'bg-primary font-bold' }}
        >
          Dashboard
        </Link>
        <Link
          to="/admin/overrides"
          className="p-2 rounded-md hover:bg-neutral-700"
          activeProps={{ className: 'bg-primary font-bold' }}
        >
          Overrides
        </Link>
      </nav>
    </aside>
  )
}
