'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
// import { ModeToggle } from '@/components/mode-toggle';
import {
  BarChart,
  CircleUser,
  Menu,
  Shield,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ModeToggle } from './mode-toggle';

const mainNav = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <BarChart className="mr-2 h-4 w-4" />,
  },
  {
    name: 'Customer Profile',
    href: '/customers',
    icon: <CircleUser className="mr-2 h-4 w-4" />,
  },
  {
    name: 'Mitigations',
    href: '/mitigations',
    icon: <Shield className="mr-2 h-4 w-4" />,
  },
];

export default function TopNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <div className="px-7">
              <Link
                href="/"
                className="flex items-center"
                onClick={() => setOpen(false)}
              >
                <Shield className="mr-2 h-5 w-5" />
                <span className="font-bold">Risk Dashboard</span>
              </Link>
            </div>
            <div className="flex flex-col gap-4 px-4 mt-6">
              {mainNav.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                    pathname === item.href ? 'bg-accent text-accent-foreground' : 'transparent'
                  )}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center md:hidden">
          <Link href="/" className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            <span className="font-bold">Risk Dashboard</span>
          </Link>
        </div>
        
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span className="hidden font-bold sm:inline-block">
              Customer Risk Dashboard
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            {mainNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'transition-colors hover:text-foreground/80 flex items-center',
                  pathname === item.href ? 'text-foreground font-medium' : 'text-foreground/60'
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex flex-1 items-center justify-end">
          <nav className="flex items-center">
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}