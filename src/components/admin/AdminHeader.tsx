import { Widget3, Bell } from "@solar-icons/react";
import { Search } from "@solar-icons/react/category";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminNav } from "./AdminNav";
import Logo from "@/components/Logo";
import { Logout } from "@solar-icons/react";
import { useNavigate } from "@tanstack/react-router";

export default function AdminHeader() {
  const navigate = useNavigate();
  const username = localStorage.getItem("availlo_user") || "Admin User";
  const initials = username.slice(0, 2).toUpperCase();
  const handleLogout = () => {
    localStorage.removeItem("availlo_token");
    localStorage.removeItem("availlo_user");
    navigate({ to: "/admin/login" });
  };
  return (
    <header className="bg-white/90 border-b border-border/70 px-4 py-4 flex items-center justify-between">
      {/* Mobile View */}
      <div className="md:hidden flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <button className="cursor-pointer p-1 text-neutral-700">
                <Widget3 className="size-8" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <AdminNav showLogo={true} />
            </SheetContent>
          </Sheet>
          <Logo />
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-1 text-neutral-700">
            <Bell size={24} />
            <span className="absolute top-1 right-1 size-3 rounded-full bg-red-500" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none">
                <Avatar className="size-8 cursor-pointer">
                  <AvatarImage src="" />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{username}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                <Logout size={18} className="mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex items-center justify-between w-full">
        <div className="relative w-full max-w-md">
          <Search.Magnifier
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
            size={18}
          />
          <Input placeholder="Search admin..." className="pl-10 w-full" />
        </div>

        <div className="flex items-center gap-4 ml-4">
          <button className="relative p-1 text-neutral-700">
            <Bell size={24} />
            <span className="absolute top-0 right-0 size-2 rounded-full bg-red-500" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none">
                <Avatar className="size-8 cursor-pointer">
                  <AvatarImage src="" />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{username}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                <Logout size={18} className="mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
