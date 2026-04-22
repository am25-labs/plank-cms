import { Outlet } from 'react-router-dom'
import { useSecondaryPanel } from '@/hooks/useSecondaryPanel.ts'
import { ContentSidebar } from '@/components/sidebars/ContentSidebar.tsx'

export function ContentManager() {
  useSecondaryPanel(<ContentSidebar />)
  return <Outlet />
}
