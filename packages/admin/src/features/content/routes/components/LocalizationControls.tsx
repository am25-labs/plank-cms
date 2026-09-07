import { Switch } from '@/shared/ui/switch.tsx'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs.tsx'

type LocalizationControlsProps = {
  localizationEnabled: boolean
  onToggleLocalization: (enabled: boolean) => void
  readOnly: boolean
  activeLocale: string
  onActiveLocaleChange: (locale: string) => void
  locales: string[]
  defaultLocale: string
}

export function LocalizationControls({
  localizationEnabled,
  onToggleLocalization,
  readOnly,
  activeLocale,
  onActiveLocaleChange,
  locales,
  defaultLocale,
}: LocalizationControlsProps) {
  const orderedLocales = [...new Set([defaultLocale, ...locales])].sort((left, right) => {
    if (left === defaultLocale) return -1
    if (right === defaultLocale) return 1
    return left.localeCompare(right)
  })

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={localizationEnabled}
            onCheckedChange={onToggleLocalization}
            disabled={readOnly}
          />
          <div>
            <p className="text-sm font-medium">Localization</p>
            <p className="text-xs text-muted-foreground">Enable per-entry localization</p>
          </div>
        </div>
        <div />
      </div>
      <div>
        {localizationEnabled && (
          <Tabs value={activeLocale} onValueChange={onActiveLocaleChange}>
            <TabsList>
              {orderedLocales.map((locale) => (
                <TabsTrigger key={locale} value={locale} disabled={readOnly}>
                  {locale.toUpperCase()}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>
    </div>
  )
}
