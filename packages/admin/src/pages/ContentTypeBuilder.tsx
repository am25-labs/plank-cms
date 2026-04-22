import { useSecondaryPanel } from '@/hooks/useSecondaryPanel.ts'
import { ContentTypesSidebar } from '@/components/sidebars/ContentTypesSidebar.tsx'

export function ContentTypeBuilder() {
  useSecondaryPanel(<ContentTypesSidebar />)
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold">Content Type Builder</h1>
    </div>
  )
}
