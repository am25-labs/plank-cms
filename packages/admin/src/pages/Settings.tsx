import { Outlet } from 'react-router-dom'
import { useSecondaryPanel } from '@/hooks/useSecondaryPanel.ts'
import { SettingsSidebar } from '@/components/sidebars/SettingsSidebar.tsx'

export function Settings() {
  useSecondaryPanel(<SettingsSidebar />)

  return <Outlet />
}
