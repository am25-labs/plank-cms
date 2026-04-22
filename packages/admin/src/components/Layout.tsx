import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboardIcon,
  LayersIcon,
  FileTextIcon,
  ImageIcon,
  Settings2Icon,
  LogOutIcon,
  UserRoundIcon,
} from 'lucide-react'
import { useAuth } from '@/context/auth.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Avatar, AvatarFallback } from '@/components/ui/avatar.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboardIcon, label: 'Dashboard' },
  { to: '/content-types', icon: LayersIcon, label: 'Content Types' },
  { to: '/content', icon: FileTextIcon, label: 'Content' },
  { to: '/media', icon: ImageIcon, label: 'Media' },
  { to: '/settings', icon: Settings2Icon, label: 'Settings' },
]

function initials(email: string) {
  return email.slice(0, 2).toUpperCase()
}

export function Layout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  function isActive(to: string) {
    return to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(to + '/')
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-svh bg-background">
        <aside className="flex w-14 flex-col items-center gap-4 border-r border-sidebar-border bg-sidebar py-4">
          {/* Logo placeholder */}
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <span className="text-xs font-bold text-muted-foreground">P</span>
          </div>

          {/* Nav */}
          <nav className="flex flex-1 flex-col items-center gap-1 pt-2">
            {NAV_ITEMS.map(({ to, icon: IconComponent, label }) => (
              <Tooltip key={to}>
                <TooltipTrigger asChild>
                  <Button asChild size="icon" variant={isActive(to) ? 'secondary' : 'ghost'}>
                    <NavLink to={to} end={to === '/'}>
                      <IconComponent className="size-4" />
                    </NavLink>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            ))}
          </nav>

          {/* User avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="size-8">
                  <AvatarFallback className="text-[11px]">
                    {user ? initials(user.email) : '??'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserRoundIcon />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-destructive focus:text-destructive"
              >
                <LogOutIcon />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </aside>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  )
}
