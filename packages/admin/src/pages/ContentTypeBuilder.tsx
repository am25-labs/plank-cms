import { Outlet } from 'react-router-dom'
import { useSecondaryPanel } from '@/hooks/useSecondaryPanel.ts'
import { ContentTypesSidebar } from '@/components/sidebars/ContentTypesSidebar.tsx'

export function ContentTypeBuilder() {
  useSecondaryPanel(<ContentTypesSidebar />)
  return <Outlet />
}
