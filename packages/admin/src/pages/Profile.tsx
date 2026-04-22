import { AccountCard } from '@/components/profile/AccountCard.tsx'
import { SecurityCard } from '@/components/profile/SecurityCard.tsx'

export function Profile() {
  return (
    <section>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 items-start">
        <div className="space-y-4">
          <AccountCard />
          <SecurityCard />
        </div>
      </div>
    </section>
  )
}
