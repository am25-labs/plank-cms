import { useSecondaryPanel } from '@/hooks/useSecondaryPanel.ts'
import { ContentSidebar } from '@/components/sidebars/ContentSidebar.tsx'

export function ContentManager() {
  useSecondaryPanel(<ContentSidebar />)
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold">Content Manager</h1>
    </div>
  )
}
