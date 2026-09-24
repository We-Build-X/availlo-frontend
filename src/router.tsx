import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { Suspense } from "react";
import { QueryClient } from "@tanstack/react-query";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/Home";
import NotFound from "./pages/NotFound";
import MobileBottomMenu from "./components/MobileBottomMenu";
import AdminHeader from "./components/admin/AdminHeader";
import AdminSidebar from "./components/admin/AdminSidebar";

// Lazy-loaded routes — keeps mapbox-gl and admin bundles out of the
// Home entry chunk (PageSpeed: render-blocking requests / unused JS).
const ExplorePage = lazyRouteComponent(() => import("./pages/Explore"));
const MapPage = lazyRouteComponent(() => import("./pages/Map"));
const VenuePage = lazyRouteComponent(() => import("./pages/Venue"));
const AdminDashboardPage = lazyRouteComponent(
  () => import("./pages/admin/Dashboard"),
);
const AdminOverridesPage = lazyRouteComponent(
  () => import("./pages/admin/Overrides"),
);
const AdminTimetablesPage = lazyRouteComponent(
  () => import("./pages/admin/Timetables"),
);
const AdminVenuesPage = lazyRouteComponent(
  () => import("./pages/admin/Venues"),
);
const AdminUploadWizardPage = lazyRouteComponent(
  () => import("./pages/admin/UploadWizard"),
);
const AdminLoginPage = lazyRouteComponent(
  () => import("./pages/admin/Login"),
);

interface RouterContext {
  queryClient: QueryClient;
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
  notFoundComponent: NotFound,
});

const publicLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "public-layout",
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen mb-20">
      <Header />
      <main className="flex-1">
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      <MobileBottomMenu />
      <Footer />
    </div>
  );
}

const indexRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/",
  component: HomePage,
});

const exploreRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/explore",
  component: ExplorePage,
});

/**
 * /map is intentionally NOT a child of publicLayoutRoute — a full-bleed
 * map is useless under a sticky header. It lives directly under the
 * root route, so it gets only the root layout (no Header, no
 * MobileBottomMenu, no Footer).
 */
const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/map",
  component: MapPage,
});

export const venueRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/venue/$id",
  component: VenuePage,
});

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/login",
  component: AdminLoginPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  beforeLoad: () => {
    const hasToken = !!localStorage.getItem("availlo_token");
    const apiConfigured = !!import.meta.env.VITE_API_BASE_URL;
    if (apiConfigured && !hasToken && window.location.pathname !== "/admin/login") {
      throw redirect({ to: "/admin/login" });
    }
  },
  component: function AdminLayout() {
    return (
      <div className="flex h-screen bg-neutral-100">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader />
          <main className="flex-1 p-4 overflow-auto min-h-0 min-w-0">
            <Suspense fallback={null}>
              <Outlet />
            </Suspense>
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

const adminVenuesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "venues",
  component: AdminVenuesPage,
});

const adminTimetablesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "timetables",
  component: AdminTimetablesPage,
});

const ADMIN_UPLOAD_WIZARD_MIN_STEP = 1;
const ADMIN_UPLOAD_WIZARD_MAX_STEP = 3;

export const adminTimetableUploadRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "timetables/upload",
  validateSearch: (search: Record<string, unknown>): { step: number } => {
    const parsedStep = Number.parseInt(String(search?.step ?? ""), 10);
    const step = Number.isFinite(parsedStep)
      ? Math.min(
          ADMIN_UPLOAD_WIZARD_MAX_STEP,
          Math.max(ADMIN_UPLOAD_WIZARD_MIN_STEP, parsedStep),
        )
      : ADMIN_UPLOAD_WIZARD_MIN_STEP;

    return {
      step,
    };
  },
  component: AdminUploadWizardPage,
});

const routeTree = rootRoute.addChildren([
  publicLayoutRoute.addChildren([indexRoute, exploreRoute, venueRoute]),
  mapRoute,
  adminLoginRoute,
  adminRoute.addChildren([
    adminDashboardRoute,
    adminOverridesRoute,
    adminVenuesRoute,
    adminTimetablesRoute,
    adminTimetableUploadRoute,
  ]),
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
