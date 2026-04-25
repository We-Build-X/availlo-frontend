import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Search } from "@solar-icons/react/category";
import { Bell } from "@solar-icons/react";
import { Link } from "@tanstack/react-router";


export default function Header() {

  const [searchQuery, setSearchQuery] = useState("")
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() =>
      setTime(new Date()), 60000)

    return () => { clearInterval(timer) };
  }, []);

  interface MainHeaderNav {
    href: string;
    label: string;
  }

  const NAV_ITEMS: MainHeaderNav[] = [
    { href: "/", label: "Home" },
    { href: "/explore", label: "Search" },
    { href: "/map", label: "Buildings" },
  ];

  return (
    <header className="bg-white flex items-center justify-between shadow-md px-5 py-2 h-20">
      <div className="flex-1 space-x-3">
        <h2 className="font-bold text-2xl cursor-pointer">Availo</h2>
      </div>

      <div className="hidden md:flex items-center space-x-8 flex-none">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className=" text-neutral-500"
          >
            {({ isActive }) => {
              return (
                <>
                  <span
                    className={`transition-all hover:text-primary ${isActive ? "text-primary border-b-3 border-primary font-bold pb-1" : "font-normal"
                      }`}
                  >
                    {item.label}
                  </span>
                </>
              );
            }}
          </Link>
        ))}
      </div>

      <div className="flex-1 flex justify-end items-center">
        <div className="relative hidden md:flex grow w-full md:max-w-45">
          <Search.Magnifier className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <Input
            placeholder="Search classrooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full bg-gray-100"
          />
        </div>
        <span className="text-gray-500 md:hidden">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div className="ml-3 p-0.5 relative cursor-pointer">
          <Bell size={28} />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
        </div>
      </div>
    </header>
  );
}
