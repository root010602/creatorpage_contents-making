"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard,
    PlusCircle,
    Settings,
    ListOrdered,
    Users,
    HelpCircle,
    X
} from "lucide-react";

const menuItems = [
    { icon: LayoutDashboard, label: "대시보드", href: "/" },
    { icon: PlusCircle, label: "콘텐츠 등록", href: "/register", isModal: true },
    { icon: ListOrdered, label: "콘텐츠 관리", href: "/manage" },
    { icon: Users, label: "사용자 관리", href: "/users" },
    { icon: Settings, label: "설정", href: "/settings" },
];

export function Sidebar() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const handleConfirm = () => {
        setIsModalOpen(false);
        router.push("/register");
    };

    return (
        <>
            <aside className="w-64 h-screen bg-surface border-r border-surface-border flex flex-col fixed left-0 top-0 z-40">
                <div className="p-6">
                    <h1 className="text-xl font-bold italic">
                        <span className="text-primary">Tourlive</span>
                        <span className="text-slate-400 ml-1 text-sm not-italic font-medium">관리자</span>
                    </h1>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {menuItems.map((item) => (
                        item.isModal ? (
                            <button
                                key={item.label}
                                onClick={() => setIsModalOpen(true)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-primary/10 hover:text-primary group"
                            >
                                <item.icon size={20} className="text-slate-400 group-hover:text-primary transition-colors" />
                                {item.label}
                            </button>
                        ) : (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-primary/10 hover:text-primary group"
                            >
                                <item.icon size={20} className="text-slate-400 group-hover:text-primary transition-colors" />
                                {item.label}
                            </Link>
                        )
                    ))}
                </nav>

                <div className="p-4 border-t border-surface-border">
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <HelpCircle size={20} className="text-slate-400" />
                        고객지원 및 도움말
                    </button>
                </div>
            </aside>

            {/* Registration Guidance Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-surface-border">
                        <div className="p-6 border-b border-surface-border flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">&lt;투어라이브 콘텐츠 계약서 안내&gt;</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        <div className="p-8">
                            <p className="text-slate-600 leading-relaxed">
                                관련 내용은 계정 정보에 작성하신 이메일로 발송됩니다.
                                <br />
                                <span className="font-bold text-slate-900">사인 및 답신 거부 시 콘텐츠 업로드에 차질이 생길 수 있음</span>을 고지합니다.
                            </p>
                        </div>
                        <div className="p-6 bg-slate-50/50 border-t border-surface-border">
                            <button
                                onClick={handleConfirm}
                                className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                            >
                                네, 확인했습니다
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
