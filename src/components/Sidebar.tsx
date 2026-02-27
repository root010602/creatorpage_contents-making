"use client";

import React from "react";
import Link from "next/link";
import {
    LayoutDashboard,
    ListOrdered,
    Users,
    Settings,
    HelpCircle
} from "lucide-react";

const menuItems = [
    { icon: LayoutDashboard, label: "대시보드", href: "/" },
    { icon: ListOrdered, label: "콘텐츠 관리", href: "/manage" },
    { icon: Users, label: "사용자 관리", href: "/users" },
    { icon: Settings, label: "설정", href: "/settings" },
];

export function Sidebar() {
    return (
        <aside className="w-64 h-screen bg-surface border-r border-surface-border flex flex-col fixed left-0 top-0 z-40">
            <div className="p-6">
                <h1 className="text-xl font-bold italic">
                    <span className="text-primary">Tourlive</span>
                    <span className="text-slate-400 ml-1 text-sm not-italic font-medium">creator</span>
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
                    고객지원 및 도움말
                </button>
            </div>
        </aside>
    );
}
