import { Link } from "@tanstack/react-router";
import { Home, Map } from "@solar-icons/react";
import { Search } from "@solar-icons/react/category";

interface IBottomNav {
  href: string;
  label: string;
  icon: typeof Home; // Outline icon
}

const NAV_ITEMS: IBottomNav[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Search", icon: Search.Magnifier },
  { href: "/map", label: "Map", icon: Map },
];

const MobileBottomMenu = () => {
  return (
    <nav className="fixed bottom-4 left-4 right-4 rounded-full h-16 bg-white/70 shadow-sm backdrop-blur-2xl md:hidden">
      <div className="flex justify-around items-center h-full">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="flex flex-col items-center justify-center text-sm text-neutral-500 w-full h-full"
          >
            {({ isActive }) => {
              const weight = isActive ? "Bold" : "Outline";
              const Icon = item.icon;
              return (
                <>
                  <Icon
                    weight={weight}
                    size={24}
                    className={`${isActive ? "text-primary" : ""}`}
                  />
                  <span
                    className={`mt-1 transition-all ${
                      isActive ? "font-bold text-primary" : "font-normal"
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
    </nav>
  );
};

export default MobileBottomMenu;
