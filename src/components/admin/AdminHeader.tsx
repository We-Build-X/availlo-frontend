import { useState } from "react"
import { HamburgerMenu, CloseCircle, Logout } from "@solar-icons/react"
import { Search } from "@solar-icons/react/category"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AdminNav } from "./AdminNav"
import { AdminSearch } from "./AdminSearch"
import Logo from "@/components/Logo"
import { useNavigate } from "@tanstack/react-router"

export default function AdminHeader() {
  const navigate = useNavigate()
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const username = localStorage.getItem("availlo_user") || "Admin User"
  const email = localStorage.getItem("availlo_email")
  const initials = username.slice(0, 2).toUpperCase()
  const handleLogout = () => {
    localStorage.removeItem("availlo_token")
    localStorage.removeItem("availlo_user")
    navigate({ to: "/admin/login" })
  }
  return (
    <header className="bg-white/90 border-b border-border/70 px-4 py-4">
      {/* Mobile View */}
      <div className="md:hidden flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="cursor-pointer p-1 text-neutral-700"
                aria-label="Open navigation menu"
              >
                <HamburgerMenu className="size-7" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <AdminNav showLogo={true} />
            </SheetContent>
          </Sheet>
          <Logo />
        </div>

        <div className="flex items-center gap-4">
          <button
            className="p-1 text-neutral-700"
            aria-label={showMobileSearch ? "Close search" : "Search"}
            onClick={() => setShowMobileSearch((v) => !v)}
          >
            {showMobileSearch ? (
              <CloseCircle size={24} />
            ) : (
              <Search.Magnifier size={24} />
            )}
          </button>
          {/* Notification bell hidden until wired to real data
          <button className="relative p-1 text-neutral-700">
            <Bell size={24} />
            <span className="absolute top-1 right-1 size-3 rounded-full bg-red-500" />
          </button>
          */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none">
                <Avatar className="size-10 cursor-pointer border-[3px] border-blue-300">
                  <AvatarImage src="" />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 border-slate-200 shadow-lg"
            >
              <DropdownMenuLabel>
                <span className="block text-sm font-bold text-slate-900">
                  {username}
                </span>
                {email ? (
                  <span className="block text-xs font-medium text-slate-500">
                    {email}
                  </span>
                ) : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer font-bold"
                onClick={handleLogout}
              >
                <Logout size={18} className="mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {showMobileSearch && (
        <div className="md:hidden mt-3 w-full">
          <AdminSearch />
        </div>
      )}

      {/* Desktop View */}
      <div className="hidden md:flex items-center justify-between w-full">
        <AdminSearch />

        <div className="flex items-center gap-4 ml-4">
          {/* Notification bell hidden until wired to real data
          <button className="relative p-1 text-neutral-700">
            <Bell size={24} />
            <span className="absolute top-0 right-0 size-2 rounded-full bg-red-500" />
          </button>
          */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none">
                <Avatar className="size-10 cursor-pointer border-[3px] border-blue-300">
                  <AvatarImage src="" />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 border-slate-200 shadow-lg"
            >
              <DropdownMenuLabel>
                <span className="block text-sm font-bold text-slate-900">
                  {username}
                </span>
                {email ? (
                  <span className="block text-xs font-medium text-slate-500">
                    {email}
                  </span>
                ) : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer font-bold"
                onClick={handleLogout}
              >
                <Logout size={18} className="mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
