"use client";

import React, { useState } from "react";
import {
    Search,
    Filter,
    Plus,
    FileText,
    MessageSquare,
    BarChart3,
    ArrowRight,
    X,
    ChevronLeft,
    Save
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ContentItem {
    id: number | string;
    title: string;
    category: string;
    author: string;
    status: string;
    date: string;
}

// Mock data
const initialContents: ContentItem[] = [];

export default function ManageContent() {
    const [activeTab, setActiveTab] = useState("management");
    const [view, setView] = useState("base"); // base, form, modal
    const [contents, setContents] = useState<ContentItem[]>(initialContents);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        content_type: "audio",
        category: "travel",
        city: "",
        description: "",
    });

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('contents')
                .insert([
                    {
                        title: formData.title,
                        type: formData.content_type,
                        category: formData.category,
                        city: formData.city,
                        description: formData.description,
                        status: 'Draft',
                        created_at: new Date().toISOString(),
                    }
                ]);

            if (error) throw error;

            alert("콘텐츠가 성공적으로 등록되었습니다!");
            setContents([...contents, {
                id: Date.now(),
                title: formData.title,
                category: formData.category === 'travel' ? '여행' : formData.category,
                author: "나",
                status: "초고",
                date: new Date().toISOString().split('T')[0]
            }]);
            setView("base");
            setFormData({ title: "", content_type: "audio", category: "travel", city: "", description: "" });
        } catch (error) {
            console.error("Error inserting data:", error);
            const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
            alert("등록 중 오류가 발생했습니다: " + message);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: "management", label: "콘텐츠 등록 및 수정", icon: FileText },
        { id: "reviews", label: "후기 관리", icon: MessageSquare },
        { id: "stats", label: "수익 통계", icon: BarChart3 },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-[#fffcf8] -m-8">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-surface-border sticky top-0 z-10 px-8 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex gap-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 pb-4 pt-2 px-1 text-sm font-bold transition-all border-b-2 relative -mb-4 ${activeTab === tab.id
                                    ? "text-primary border-primary"
                                    : "text-slate-400 border-transparent hover:text-slate-600"
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
                {activeTab === "management" ? (
                    view === "form" ? (
                        /* Registration Form View */
                        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setView("base")}
                                    className="p-2 hover:bg-white rounded-xl border border-surface-border transition-colors group"
                                >
                                    <ChevronLeft size={20} className="text-slate-400 group-hover:text-primary" />
                                </button>
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">콘텐츠 등록</h2>
                                    <p className="text-slate-500 mt-1">새로운 투어라이브 콘텐츠 정보를 직접 입력해 주세요.</p>
                                </div>
                            </div>

                            <form onSubmit={handleFormSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <div className="bg-white p-6 rounded-3xl border border-surface-border shadow-sm space-y-4">
                                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                콘텐츠 제목
                                            </label>
                                            <input
                                                required
                                                name="title"
                                                value={formData.title}
                                                onChange={handleFormChange}
                                                type="text"
                                                placeholder="예: 파리 루브르 박물관 투어"
                                                className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-slate-50/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                        <div className="bg-white p-6 rounded-3xl border border-surface-border shadow-sm space-y-4">
                                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                콘텐츠 유형
                                            </label>
                                            <select
                                                name="content_type"
                                                value={formData.content_type}
                                                onChange={handleFormChange}
                                                className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-slate-50/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="audio">오디오 가이드</option>
                                                <option value="video">워킹 투어 (영상)</option>
                                                <option value="text">E-북 / 가이드북</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="bg-white p-6 rounded-3xl border border-surface-border shadow-sm space-y-4">
                                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                카테고리
                                            </label>
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleFormChange}
                                                className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-slate-50/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="travel">여행 / 투어</option>
                                                <option value="history">역사 / 문화</option>
                                                <option value="food">음식 / 맛집</option>
                                                <option value="lifestyle">라이프스타일</option>
                                            </select>
                                        </div>
                                        <div className="bg-white p-6 rounded-3xl border border-surface-border shadow-sm space-y-4">
                                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                도시
                                            </label>
                                            <input
                                                required
                                                name="city"
                                                value={formData.city}
                                                onChange={handleFormChange}
                                                type="text"
                                                placeholder="예: 서울, 도쿄, 파리"
                                                className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-slate-50/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-surface-border shadow-sm space-y-4">
                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                        콘텐츠 설명
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleFormChange}
                                        rows={5}
                                        placeholder="이 투어에 대한 핵심 설명을 입력해 주세요."
                                        className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-slate-50/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                    />
                                </div>
                                <div className="flex justify-end gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setView("base")}
                                        className="px-8 py-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                    >
                                        취소
                                    </button>
                                    <button
                                        disabled={loading}
                                        type="submit"
                                        className="flex items-center justify-center gap-2 px-12 py-4 bg-primary hover:bg-primary/90 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                                    >
                                        {loading ? (
                                            <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Save size={20} />
                                                콘텐츠 등록하기
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : contents.length > 0 ? (
                        /* List View */
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

                            <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white border border-surface-border p-4 rounded-3xl shadow-sm">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="콘텐츠 제목으로 검색..."
                                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-surface-border bg-slate-50/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex items-center gap-2 px-4 py-3 border border-surface-border rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                                        <Filter size={16} />
                                        필터
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white border border-surface-border rounded-3xl shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 border-b border-surface-border">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">제목</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">카테고리</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">상태</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">관리</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-border">
                                        {contents.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <span className="font-bold text-slate-900 group-hover:text-primary transition-colors cursor-pointer">{item.title}</span>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-slate-600">{item.category}</td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${item.status === '공개' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                                                        <ArrowRight size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* Empty View (White Background) */
                        <div className="flex items-center justify-center min-h-[70vh] animate-in zoom-in-95 duration-500">
                            <div className="bg-white p-16 rounded-[48px] border border-surface-border shadow-2xl flex flex-col items-center text-center max-w-xl w-full">
                                <div className="w-28 h-28 bg-primary/10 rounded-full flex items-center justify-center mb-10">
                                    <Plus size={48} className="text-primary" />
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-4">등록된 콘텐츠가 없습니다.</h3>
                                <p className="text-slate-500 mb-12 text-lg leading-relaxed">
                                    투어라이브 크리에이터가 되어 첫 번째 콘텐츠를 등록해 보세요!<br />
                                    정성스러운 가이드가 수많은 여행자들에게 닿을 수 있습니다.
                                </p>
                                <button
                                    onClick={() => setView("modal")}
                                    className="w-full bg-primary hover:bg-primary/90 text-white py-6 rounded-[32px] font-bold text-xl shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
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
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 bg-white border border-surface-border rounded-[40px] shadow-sm">
                        <p className="text-xl font-bold mb-2">준비 중인 서비스입니다.</p>
                        <p className="text-slate-400">후기 관리 및 통계 기능이 곧 업데이트됩니다!</p>
                    </div>
                )}
            </main>

            {/* Guidance Modal Overlay */}
            {view === "modal" && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-surface-border">
                        <div className="p-8 border-b border-surface-border flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-900">&lt;콘텐츠 계약서 안내&gt;</h3>
                            <button
                                onClick={() => setView("base")}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X size={24} className="text-slate-500" />
                            </button>
                        </div>
                        <div className="p-10">
                            <p className="text-slate-600 text-lg leading-relaxed mb-4">
                                관련 내용은 계정 정보에 작성하신 이메일로 발송됩니다.
                            </p>
                            <p className="text-slate-900 font-bold text-lg leading-relaxed">
                                사인 및 답신 거부 시 콘텐츠 업로드에 차질이 생길 수 있음을 고지합니다.
                            </p>
                        </div>
                        <div className="p-8 bg-slate-50/50 border-t border-surface-border">
                            <button
                                onClick={() => setView("form")}
                                className="w-full py-5 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-[24px] shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
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
