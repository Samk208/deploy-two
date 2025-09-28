"use client";

import GoogleTranslate from "@/components/global/GoogleTranslate";
import { CartSidebar } from "@/components/shop/cart-sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";
import { useCartStore } from "@/lib/store/cart";
import { UserRole } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

// Custom SVG icons to replace lucide-react
const SearchIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const MenuIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const XIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const GlobeIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    className="h-3 w-3"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const UserIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const DashboardIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
);

const SettingsIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

// Minimal Shopping Cart icon (SVG) for header
const ShoppingCartIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13L6 6M7 13l-2 8h14m-8-8v8m4-8v8"
    />
  </svg>
);

// Cart icon with badge, safe for SSR (mount+subscribe)
function CartIcon() {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    try {
      const state = useCartStore.getState();
      const initial = state.items.reduce((t, i) => t + i.quantity, 0);
      setCount(initial);
      const unsub = useCartStore.subscribe((s) => {
        const next = s.items.reduce((t, i) => t + i.quantity, 0);
        setCount(next);
      });
      return () => unsub();
    } catch (_) {
      // no-op for SSR
    }
  }, []);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="relative inline-flex items-center"
          aria-label="Cart"
          type="button"
        >
          <ShoppingCartIcon />
          {mounted && count > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 min-w-[1.25rem] px-1 text-[10px] leading-5 text-center font-bold">
              {count}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-96 p-0">
        <CartSidebar />
      </SheetContent>
    </Sheet>
  );
}

const navigation = [
  { name: "Shop", href: "/shop" },
  // Directory of influencer shops
  { name: "Influencer Shop", href: "/shops" },
  { name: "For Influencers", href: "/influencers" },
  { name: "For Brands", href: "/brands" },
  { name: "Pricing", href: "/pricing" },
  { name: "Blog", href: "/blog" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [currentLang, setCurrentLang] = useState<
    "auto" | "en" | "ko" | "zh-CN"
  >("auto");
  const { user, signOut } = useAuth();

  const getDashboardUrl = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "/admin/dashboard";
      case UserRole.SUPPLIER:
        return "/dashboard/supplier";
      case UserRole.INFLUENCER:
        return "/dashboard/influencer";
      case UserRole.CUSTOMER:
        return "/shop";
      default:
        return "/";
    }
  };

  const handleSignOut = () => {
    signOut();
    setMobileMenuOpen(false);
  };

  // Sync header label with Google Translate cookie
  useEffect(() => {
    const get = (window as any).getTranslateLanguage as
      | (() => "auto" | "en" | "ko" | "zh-CN")
      | undefined;
    if (typeof get === "function") {
      setCurrentLang(get());
    }
    const id = setInterval(() => {
      const g = (window as any).getTranslateLanguage as
        | (() => "auto" | "en" | "ko" | "zh-CN")
        | undefined;
      if (typeof g === "function") {
        setCurrentLang(g());
      }
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const changeLanguage = (lang: "en" | "ko" | "zh-CN") => {
    const set = (window as any).setTranslateLanguage as
      | ((l: "en" | "ko" | "zh-CN") => void)
      | undefined;
    if (typeof set === "function") {
      set(lang);
      setCurrentLang(lang);
    }
  };

  const langLabel = (code: "auto" | "en" | "ko" | "zh-CN") => {
    switch (code) {
      case "en":
        return "EN";
      case "ko":
        return "KO";
      case "zh-CN":
        return "简体";
      default:
        return "EN";
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-indigo-600 text-white px-4 py-2 rounded-lg z-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">OL</span>
              </div>
              <span className="font-bold text-xl text-gray-900">One-Link</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center space-x-8"
            role="navigation"
            aria-label="Main navigation"
          >
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-2 py-1"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <SearchIcon />
              <Input
                type="search"
                placeholder="Search products, influencers..."
                className="pl-10 pr-4 py-2 w-full rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                aria-label="Search products and influencers"
                data-testid="primary-search"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Google Translate Widget */}
            <GoogleTranslate />
            {/* Cart Icon */}
            <CartIcon />
            {/* Language Toggle (EN / KO / 中文) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex items-center space-x-1"
                  aria-label="Language settings"
                >
                  <GlobeIcon />
                  <span className="text-sm" data-testid="lang-label">
                    {langLabel(currentLang)}
                  </span>
                  <ChevronDownIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Auto-translate via Google
                    </span>
                    <Switch
                      checked={autoTranslate}
                      onCheckedChange={setAutoTranslate}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Automatically translate content to your preferred language
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => changeLanguage("en")}>
                  English (EN)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("ko")}>
                  한국어 (KO)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("zh-CN")}>
                  中文（简体）
                </DropdownMenuItem>
                {/* Traditional Chinese removed per requirements */}
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              /* Authenticated User Menu */
              <div className="hidden sm:flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2"
                      aria-label="User menu"
                      data-testid="user-menu"
                    >
                      <img
                        src={
                          user.avatar ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || user.email || "User")}`
                        }
                        alt={user.name || user.email || "User"}
                        className="h-6 w-6 rounded-full"
                      />
                      <span className="text-sm font-medium">
                        {user.name ??
                          (user.email ? user.email.split("@")[0] : "User")}
                      </span>
                      <ChevronDownIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium">
                        {user.name ??
                          (user.email ? user.email.split("@")[0] : "User")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.email ?? ""}
                      </p>
                      <p className="text-xs text-amber-600 capitalize">
                        {user.role}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href={getDashboardUrl(user.role)}
                        className="flex items-center space-x-2"
                      >
                        <DashboardIcon />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/settings"
                        className="flex items-center space-x-2"
                      >
                        <SettingsIcon />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 text-red-600"
                      data-testid="menu-signout"
                    >
                      <LogoutIcon />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              /* Auth Buttons for non-authenticated users */
              <div className="hidden sm:flex items-center space-x-3">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  asChild
                >
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <XIcon /> : <MenuIcon />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden pb-4">
          <div className="relative">
            <SearchIcon />
            <Input
              type="search"
              placeholder="Search products, influencers..."
              className="pl-10 pr-4 py-2 w-full rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
              aria-label="Search products and influencers"
              data-testid="mobile-search"
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden border-t bg-white"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="border-t pt-4 mt-4">
                {user ? (
                  <div className="flex flex-col space-y-3 px-3">
                    <div className="flex items-center space-x-3 pb-3">
                      <img
                        src={
                          user.avatar ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || user.email || "User")}`
                        }
                        alt={user.name || user.email || "User"}
                        className="h-8 w-8 rounded-full"
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {user.name ??
                            (user.email ? user.email.split("@")[0] : "User")}
                        </p>
                        <p className="text-xs text-amber-600 capitalize">
                          {user.role}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={getDashboardUrl(user.role)}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href="/settings"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Settings
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      className="text-red-600"
                      data-testid="menu-signout-mobile"
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-3 px-3">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/sign-in">Sign In</Link>
                    </Button>
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700"
                      asChild
                    >
                      <Link href="/sign-up">Get Started</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
