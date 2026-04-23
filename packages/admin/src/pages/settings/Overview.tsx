import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.tsx'
import { MediaSettings } from './media/MediaSettings.tsx'

export function SettingsOverview() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          General configuration for your CMS instance.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="media">Media Library</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <p className="text-sm text-muted-foreground">No settings available yet.</p>
        </TabsContent>

        <TabsContent value="media">
          <MediaSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
