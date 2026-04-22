import { SidebarNav } from './SidebarNav.tsx'

export function ContentSidebar() {
  return (
    <div className="flex flex-col">
      <div className="border-b border-sidebar-border px-4 py-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content</p>
      </div>
      <SidebarNav items={[]} />
    </div>
  )
}
