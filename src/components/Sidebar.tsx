import React from "react";
import Link from "next/link";
import {
    LayoutDashboard,
    PlusCircle,
    Settings,
    ListOrdered,
    Users,
    HelpCircle
} from "lucide-react";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: PlusCircle, label: "Register Content", href: "/register" },
    { icon: ListOrdered, label: "Manage Content", href: "/manage" },
    { icon: Users, label: "User Management", href: "/users" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
    return (
        <aside className="w-64 h-screen bg-surface border-r border-surface-border flex flex-col fixed left-0 top-0 z-50">
            <div className="p-6">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent italic">
                    Content Platform
                </h1>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                {menuItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-primary/10 hover:text-primary group"
                    >
                        <item.icon size={20} className="text-slate-400 group-hover:text-primary transition-colors" />
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-surface-border">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <HelpCircle size={20} className="text-slate-400" />
                    Support & Help
                </button>
            </div>
        </aside>
    );
}
