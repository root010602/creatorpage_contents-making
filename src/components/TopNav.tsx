"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ListOrdered,
    Users,
    Settings,
    HelpCircle,
    UserCircle,
    ChevronDown
} from "lucide-react";

const menuItems = [
    { label: "대시보드", href: "/" },
    { label: "콘텐츠 등록 및 수정", href: "/manage" },
    {
        label: "후기 관리",
        href: "#",
        dropdown: [
            { label: "투어 후기", href: "/reviews/tours" },
            { label: "트랙 댓글", href: "/reviews/tracks" },
            { label: "후기 정책 및 신고", href: "/reviews/policy" }
        ]
    },
    { label: "콘텐츠 만드는 법", href: "/guide" },
    { label: "계정관리", href: "/settings" },
];

export function TopNav() {
    const pathname = usePathname();

    return (
        <header className="h-16 w-full bg-white border-b border-surface-border fixed top-0 left-0 z-50 px-6 backdrop-blur-md bg-white/80">
            <div className="h-full flex items-center justify-between mx-auto">
                <div className="flex items-center gap-10">
                    <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                        <h1 className="text-xl font-normal italic">
                            <span className="text-primary">Tourlive</span>
                            <span className="text-slate-400 ml-1 text-sm not-italic font-normal">creator</span>
                        </h1>
                    </Link>

                    <nav className="flex items-center gap-2">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            const hasDropdown = !!item.dropdown;

                            return (
                                <div key={item.label} className="relative group">
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-normal rounded-lg transition-all duration-200 ${isActive
                                            ? "text-primary bg-primary/5"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                    >
                                        {item.label}
                                        {hasDropdown && <ChevronDown size={14} className="opacity-50 group-hover:rotate-180 transition-transform" />}
                                    </Link>

                                    {hasDropdown && (
                                        <div className="absolute top-full left-0 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                                            <div className="w-56 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 py-3 overflow-hidden">
                                                {item.dropdown?.map((sub) => (
                                                    <Link
                                                        key={sub.label}
                                                        href={sub.href}
                                                        className="block px-4 py-2.5 text-xs font-normal text-slate-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                                    >
                                                        {sub.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-normal text-slate-900 leading-none">Tourlive Admin</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-tighter">Administrator</p>
                        </div>
                        <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white border border-slate-800 shadow-lg">
                            <UserCircle size={20} />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
