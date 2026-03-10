"use client";

import React, { useState } from "react";
import {
    Plus,
    FileText,
    ChevronLeft,
    ChevronRight,
    Edit2,
    X
} from "lucide-react";
import Image from "next/image";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import ContentRegistrationForm from "@/components/ContentRegistrationForm";

interface ContentItem {
    id: number | string;
    thumbnail?: string;
    title: string;
    description: string;
    created_at: string;
    registered_at: string;
    size: string;
    review_status: "심사 대기" | "심사 중" | "심사 완료" | "반려";
    sales_status: "판매 중" | "판매 중지";
    category: string;
    author: string;
}

// Proper types for database schema
interface DBContent {
    id: string;
    title: string | null;
    type: string | null;
    category: string | null;
    city: string | null;
    description: string | null;
    museum_name: string | null;
    museum_link: string | null;
    map_type: string | null;
    price: string | null;
    thumbnail_url: string | null;
    gallery_urls: string[] | null;
    epub_url: string | null;
    status: string | null;
    size: string | null;
    created_at: string;
    registered_at: string | null;
}

// Mock data (6 items to test pagination)
// initialContents removed as it was unused

export default function ManageContent() {
    const [view, setView] = useState("base"); // base, form, modal
    const [contents, setContents] = useState<ContentItem[]>([]);

    // Pagination state (for management list)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(contents.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = contents.slice(indexOfFirstItem, indexOfLastItem);

    const fetchContents = async () => {
        if (!isSupabaseConfigured) {
            console.log("[Mock Fetch] Fetching contents skipped (Supabase not configured)");
            return;
        }
        try {
            const { data, error } = await supabase
                .from('contents')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const mappedData: ContentItem[] = (data as DBContent[]).map((item) => ({
                    id: item.id || '',
                    thumbnail: item.thumbnail_url || 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=100&h=100&fit=crop',
                    title: item.title || '무제 콘텐츠',
                    description: item.description || '',
                    created_at: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : '',
                    registered_at: item.registered_at ? new Date(item.registered_at).toISOString().split('T')[0] : '-',
                    size: item.size || '0 MB',
                    review_status: (item.status === 'Draft' ? '심사 대기' : '심사 완료') as ContentItem['review_status'],
                    sales_status: '판매 중',
                    category: item.category || '',
                    author: '작가'
                }));
                setContents(mappedData);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        }
    };

    React.useEffect(() => {
        fetchContents();
    }, []);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);




    return (
        <div className="flex flex-col min-h-screen bg-slate-100/50 -m-8">


            {/* Main Content Area */}
            <main className="flex-1 p-8 max-w-[1400px] mx-auto w-full">
                {view === "form" ? (
                    /* Multi-Step Registration Form View */
                    <ContentRegistrationForm onList={() => setView("list")} onRefresh={fetchContents} />
                ) : (
                    contents.length > 0 ? (
                        /* Content List Table View */
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">콘텐츠 목록</h2>
                                    <p className="text-slate-500 text-sm mt-1">총 {contents.length}개의 콘텐츠가 있습니다.</p>
                                </div>
                                <button
                                    onClick={() => setView("modal")}
                                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                >
                                    <Plus size={18} />
                                    새 콘텐츠 만들기
                                </button>
                            </div>

                            <div className="bg-white border border-surface-border rounded-[32px] shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-surface-border">
                                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">썸네일</th>
                                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">콘텐츠 제목/설명</th>
                                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">수정</th>
                                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">생성일</th>
                                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">등록일</th>
                                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">용량</th>
                                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">심사 여부</th>
                                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider pr-8">판매 상태</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-border">
                                            {currentItems.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                                                    <td className="px-6 py-5">
                                                        <div className="flex justify-center">
                                                            {item.thumbnail ? (
                                                                <Image src={item.thumbnail} alt={item.title} width={64} height={64} className="w-16 h-16 rounded-xl object-cover border border-surface-border shadow-sm" />
                                                            ) : (
                                                                <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center border border-surface-border">
                                                                    <FileText size={24} className="text-slate-300" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 max-w-sm">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900 text-base mb-1 group-hover:text-primary transition-colors">{item.title}</span>
                                                            <span className="text-slate-400 text-xs truncate">{item.description}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                                                            <Edit2 size={18} />
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-5 text-sm text-slate-600 font-medium whitespace-nowrap">{item.created_at}</td>
                                                    <td className="px-6 py-5 text-sm text-slate-600 font-medium whitespace-nowrap">{item.registered_at}</td>
                                                    <td className="px-6 py-5 text-sm text-slate-600 font-bold whitespace-nowrap">{item.size}</td>
                                                    <td className="px-6 py-5 whitespace-nowrap">
                                                        <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${item.review_status === '심사 완료' ? 'bg-emerald-100 text-emerald-700' :
                                                            item.review_status === '심사 중' ? 'bg-blue-100 text-blue-700' :
                                                                item.review_status === '심사 대기' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {item.review_status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 whitespace-nowrap pr-8">
                                                        <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${item.sales_status === '판매 중' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'
                                                            }`}>
                                                            {item.sales_status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="p-8 border-t border-surface-border flex items-center justify-between bg-slate-50/30">
                                    <div className="text-sm text-slate-500 font-medium">
                                        전체 <span className="text-slate-900 font-bold">{contents.length}</span>개 중 <span className="text-slate-900 font-bold">{indexOfFirstItem + 1}</span> - <span className="text-slate-900 font-bold">{Math.min(indexOfLastItem, contents.length)}</span> 표시
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => paginate(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="p-3 border border-surface-border rounded-2xl hover:bg-white transition-all disabled:opacity-30 disabled:hover:bg-transparent shadow-sm bg-white"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => paginate(i + 1)}
                                                className={`w-12 h-12 flex items-center justify-center rounded-2xl font-bold text-sm transition-all shadow-sm ${currentPage === i + 1
                                                    ? "bg-primary text-white shadow-primary/20"
                                                    : "bg-white border border-surface-border text-slate-400 hover:text-slate-600 hover:border-slate-300"
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-3 border border-surface-border rounded-2xl hover:bg-white transition-all disabled:opacity-30 disabled:hover:bg-transparent shadow-sm bg-white"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Empty View (Refined for Readability) */
                        <div className="flex items-center justify-center min-h-[70vh] animate-in zoom-in-95 duration-500">
                            <div className="bg-white p-16 rounded-[48px] border border-surface-border shadow-2xl flex flex-col items-center text-center max-w-2xl w-full translate-y-[-20px]">
                                <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-10 relative">
                                    <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping duration-[3s]" />
                                    <FileText size={56} className="text-primary relative z-10" />
                                    <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg border border-surface-border">
                                        <Plus size={20} className="text-primary" />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">아직 등록된 콘텐츠가 없어요</h3>
                                <p className="text-slate-500 mb-12 text-lg leading-[1.6] whitespace-pre-wrap">
                                    콘텐츠 등록 후 심사를 거쳐 공개돼요{"\n"}
                                    지금 첫 콘텐츠를 만들어보세요
                                </p>
                                <button
                                    onClick={() => setView("modal")}
                                    className="w-full max-w-sm bg-primary hover:bg-primary/90 text-white py-6 rounded-[32px] font-bold text-xl shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                                >
                                    <Plus size={28} />
                                    콘텐츠 만들기
                                </button>
                                <p className="mt-8 text-slate-400 text-sm">
                                    도움이 필요하신가요?
                                    <button className="underline hover:text-primary transition-colors ml-1 font-medium">크리에이터 가이드</button>
                                </p>
                            </div>
                        </div>
                    )
                )}
            </main>

            {/* Guidance Modal Overlay (Refined for Readability - max-w-2xl) */}
            {view === "modal" && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-surface-border">
                        <div className="p-10 border-b border-surface-border flex flex-col items-center relative bg-slate-50/30">
                            <button
                                onClick={() => setView("base")}
                                className="absolute right-10 top-10 p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X size={24} className="text-slate-500" />
                            </button>
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                <FileText size={40} className="text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">&lt;투어라이브 콘텐츠 계약서 안내&gt;</h3>
                        </div>
                        <div className="p-14 text-center">
                            <div className="space-y-4">
                                <p className="text-slate-600 text-lg leading-[1.6]">
                                    관련 내용은 계정 정보에 작성하신 이메일로 발송됩니다.
                                </p>
                                <p className="text-slate-900 font-bold text-lg leading-[1.6]">
                                    사인 및 답신 거부 시 콘텐츠 업로드에 차질이 생길 수 있음을 고지합니다.
                                </p>
                            </div>
                        </div>
                        <div className="p-10 bg-slate-50/30 border-t border-surface-border">
                            <button
                                onClick={() => setView("form")}
                                className="w-full py-6 bg-primary hover:bg-primary/90 text-white font-bold text-xl rounded-[32px] shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                            >
                                네, 확인했습니다
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
