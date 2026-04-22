import { UsersIcon, ShieldIcon, KeyRoundIcon } from 'lucide-react'
import { SidebarNav } from './SidebarNav.tsx'

const ITEMS = [
  { label: 'Users', to: '/settings/users', icon: UsersIcon },
  { label: 'Roles', to: '/settings/roles', icon: ShieldIcon },
  { label: 'API Tokens', to: '/settings/api-tokens', icon: KeyRoundIcon },
]

export function SettingsSidebar() {
  return (
    <div className="flex flex-col">
      <div className="border-b border-sidebar-border px-4 py-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Settings</p>
      </div>
      <SidebarNav items={ITEMS} />
    </div>
  )
}
