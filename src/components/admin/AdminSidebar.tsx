import { AdminNav } from "./AdminNav";

export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-white border-r border-border hidden md:block">
      <AdminNav showLogo={true} />
    </aside>
  );
}
