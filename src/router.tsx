import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/Home";
import ExplorePage from "./pages/Explore";
import MapPage from "./pages/Map";
import VenuePage from "./pages/Venue";
import AdminDashboardPage from "./pages/admin/Dashboard";
import AdminOverridesPage from "./pages/admin/Overrides";
import AdminTimetablesPage from "./pages/admin/Timetables";
import MobileBottomMenu from "./components/MobileBottomMenu";

interface RouterContext {
  queryClient: QueryClient;
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Root,
});

function Root() {
  return (
    <div className="flex flex-col min-h-screen mb-20">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <MobileBottomMenu />
      <Footer />
    </div>
  );
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explore",
  component: ExplorePage,
});

const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/map",
  component: MapPage,
});

export const venueRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/venue/$id",
  component: VenuePage,
});

import AdminHeader from "./components/admin/AdminHeader";
import AdminSidebar from "./components/admin/AdminSidebar";

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: function AdminLayout() {
    return (
      <div className="flex h-screen bg-neutral-100">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader />
          <main className="flex-1 p-4 overflow-auto min-h-0 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    );
  },
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "dashboard",
  component: AdminDashboardPage,
});

const adminOverridesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "overrides",
  component: AdminOverridesPage,
});

const adminTimetablesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "timetables",
  component: AdminTimetablesPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  exploreRoute,
  mapRoute,
  venueRoute,
  adminRoute.addChildren([adminDashboardRoute, adminOverridesRoute, adminTimetablesRoute]),
]);

export const router = createRouter({
  routeTree,
  context: {
    queryClient: undefined!,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
