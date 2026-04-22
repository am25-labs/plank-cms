import { useSecondaryPanel } from '@/hooks/useSecondaryPanel.ts'
import { SettingsSidebar } from '@/components/sidebars/SettingsSidebar.tsx'

export function Settings() {
  useSecondaryPanel(<SettingsSidebar />)

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold">Settings</h1>
    </div>
  )
}
