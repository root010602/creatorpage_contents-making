"use client";

import React, { useState } from "react";
import {
    Plus,
    FileText,
    MessageSquare,
    BarChart3,
    X,
    ChevronLeft,
    ChevronRight,
    Edit2,
    CheckCircle2
} from "lucide-react";
import { supabase } from "@/lib/supabase";

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

// Mock data (6 items to test pagination)
const initialContents: ContentItem[] = [
    {
        id: 1,
        thumbnail: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=100&h=100&fit=crop",
        title: "파리 에펠탑 야경 투어",
        description: "낭만적인 파리의 밤을 즐기는 최고의 방법",
        created_at: "2024-02-20",
        registered_at: "2024-02-21",
        size: "128 MB",
        review_status: "심사 완료",
        sales_status: "판매 중",
        category: "여행",
        author: "홍길동"
    },
    {
        id: 2,
        thumbnail: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=100&h=100&fit=crop",
        title: "도쿄 시부야 맛집 정복",
        description: "현지인들만 아는 숨은 맛집 리스트",
        created_at: "2024-02-22",
        registered_at: "2024-02-23",
        size: "85 MB",
        review_status: "심사 중",
        sales_status: "판매 중지",
        category: "음식",
        author: "김철수"
    },
    {
        id: 3,
        thumbnail: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=100&h=100&fit=crop",
        title: "런던 브리티시 뮤지엄 가이드",
        description: "대영박물관 핵심 유물 10개 완벽 해설",
        created_at: "2024-02-24",
        registered_at: "2024-02-25",
        size: "210 MB",
        review_status: "심사 대기",
        sales_status: "판매 중지",
        category: "역사",
        author: "이영희"
    },
    {
        id: 4,
        thumbnail: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=100&h=100&fit=crop",
        title: "뉴욕 센트럴 파크 산책",
        description: "도심 속 숲에서의 힐링 시간",
        created_at: "2024-02-25",
        registered_at: "2024-02-26",
        size: "156 MB",
        review_status: "심사 완료",
        sales_status: "판매 중",
        category: "여행",
        author: "박명수"
    },
    {
        id: 5,
        thumbnail: "https://images.unsplash.com/photo-1550338861-b7cfeaf8ffd8?w=100&h=100&fit=crop",
        title: "로마 바티칸 반나절 투어",
        description: "미켈란젤로의 천장화를 만나는 감동",
        created_at: "2024-02-26",
        registered_at: "2024-02-27",
        size: "320 MB",
        review_status: "심사 완료",
        sales_status: "판매 중",
        category: "역사",
        author: "정준하"
    },
    {
        id: 6,
        thumbnail: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=100&h=100&fit=crop",
        title: "베를린 장벽의 역사",
        description: "분단의 아픔과 통일의 기쁨 스토리",
        created_at: "2024-02-27",
        registered_at: "2024-02-27",
        size: "190 MB",
        review_status: "심사 대기",
        sales_status: "판매 중지",
        category: "역사",
        author: "유재석"
    },
];

export default function ManageContent() {
    const [activeTab, setActiveTab] = useState("management");
    const [view, setView] = useState("base"); // base, form, modal
    const [contents] = useState<ContentItem[]>(initialContents);
    const [loading, setLoading] = useState(false);

    // Multi-step Registration State
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        contentType: "audio_video", // electronic_book, audio_video
        category: "",
        city: "",
        cityType: "normal", // normal, none, global
        title: "",
        description: "",
    });

    // Dynamic steps configuration
    const steps = [
        { id: 1, title: "카테고리 선택" },
        { id: 2, title: "상세 페이지 제작" },
        { id: 3, title: "심사 과정" },
    ];

    // Pagination state (for management list)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(contents.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = contents.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleStepChange = (stepId: number) => {
        if (stepId === currentStep) return;
        if (window.confirm("입력한 내용을 저장하고 이동하시겠습니까?")) {
            handleSaveAndNext(stepId);
        }
    };

    const handleSaveAndNext = async (nextStep?: number) => {
        setLoading(true);
        try {
            // Data Persistence Logic (Supabase Upsert)
            const { error } = await supabase
                .from('contents')
                .upsert([
                    {
                        // id: item?.id, // Logic to handle existing vs new item
                        title: formData.title || "무제 콘텐츠",
                        type: formData.contentType,
                        category: formData.category,
                        city: formData.city,
                        description: formData.description,
                        status: 'Draft',
                        updated_at: new Date().toISOString(),
                    }
                ]);

            if (error) throw error;

            if (nextStep) {
                setCurrentStep(nextStep);
            } else {
                setCurrentStep((prev) => Math.min(prev + 1, steps.length));
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("저장 중 오류가 발생했습니다.");
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
            <main className="flex-1 p-8 max-w-[1400px] mx-auto w-full">
                {activeTab === "management" ? (
                    view === "form" ? (
                        /* Multi-Step Registration Form View */
                        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Header Section */}
                            <div className="flex items-center justify-between py-10">
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900">콘텐츠 등록 및 수정</h2>
                                <button
                                    onClick={() => setView("base")}
                                    className="px-4 py-2 text-slate-500 hover:text-slate-900 font-medium transition-colors"
                                >
                                    뒤로가기
                                </button>
                            </div>

                            {/* Stepper Navigation */}
                            <div className="bg-white p-12 rounded-[40px] border border-surface-border shadow-sm mb-10 overflow-hidden">
                                <div className="relative flex justify-between items-center max-w-4xl mx-auto">
                                    <div className="absolute top-[28px] left-0 w-full h-[2px] bg-slate-100 -z-0" />
                                    <div
                                        className="absolute top-[28px] left-0 h-[2px] bg-primary transition-all duration-500 -z-0"
                                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                                    />

                                    {steps.map((step) => (
                                        <button
                                            key={step.id}
                                            onClick={() => handleStepChange(step.id)}
                                            className="relative z-10 flex flex-col items-center group"
                                        >
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 shadow-lg ${currentStep >= step.id
                                                ? "bg-primary text-white shadow-primary/30 scale-110"
                                                : "bg-white text-slate-300 border border-slate-200"
                                                }`}>
                                                {step.id}
                                            </div>
                                            <span className={`mt-4 text-sm font-bold whitespace-nowrap transition-colors ${currentStep >= step.id ? "text-primary" : "text-slate-300"
                                                }`}>
                                                {step.title}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-20 pt-10 border-t border-slate-50 text-slate-500 text-sm space-y-1">
                                    <p>• 안내에 따라 콘텐츠 내용을 정확하게 설명해 주세요.</p>
                                    <p>• 콘텐츠 제작이 완료되면, 승인을 위한 심사가 진행됩니다.</p>
                                </div>
                            </div>

                            {/* Step Content: Step 1 (Simplified for 3 items) */}
                            <div className="bg-white rounded-[40px] border border-surface-border shadow-sm p-12 space-y-12 mb-10">
                                {currentStep === 1 && (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                                        {/* 1. 콘텐츠 유형 */}
                                        <div className="space-y-6">
                                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">2</div>
                                                콘텐츠 유형*
                                                <span className="text-slate-400 text-sm font-normal ml-2">택 1</span>
                                            </h3>
                                            <div className="flex gap-10 pl-9">
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <div className={`w-6 h-6 border-2 rounded flex items-center justify-center transition-all ${formData.contentType === 'electronic_book' ? "bg-primary border-primary" : "border-slate-200 group-hover:border-primary"
                                                        }`}>
                                                        {formData.contentType === 'electronic_book' && <div className="w-2 h-2 bg-white rounded-sm" />}
                                                    </div>
                                                    <input
                                                        type="radio" className="hidden"
                                                        name="contentType" value="electronic_book"
                                                        checked={formData.contentType === 'electronic_book'}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, contentType: e.target.value }))}
                                                    />
                                                    <span className="text-lg font-medium text-slate-700">전자책</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <div className={`w-6 h-6 border-2 rounded flex items-center justify-center transition-all ${formData.contentType === 'audio_video' ? "bg-primary border-primary" : "border-slate-200 group-hover:border-primary"
                                                        }`}>
                                                        {formData.contentType === 'audio_video' && <div className="w-2 h-2 bg-white rounded-sm" />}
                                                    </div>
                                                    <input
                                                        type="radio" className="hidden"
                                                        name="contentType" value="audio_video"
                                                        checked={formData.contentType === 'audio_video'}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, contentType: e.target.value }))}
                                                    />
                                                    <span className="text-lg font-medium text-slate-700">오디오 / 비디오</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-50 w-full" />

                                        {/* 2. 카테고리 리스트 */}
                                        <div className="space-y-6">
                                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">6</div>
                                                카테고리*
                                                <span className="text-slate-400 text-sm font-normal ml-2">택 1</span>
                                            </h3>
                                            <div className="grid grid-cols-1 gap-4 pl-9">
                                                {[
                                                    { id: 'attraction', label: '명소', desc: '세비야 대성당 투어, 알함브라 궁전 투어' },
                                                    { id: 'city_tour', label: '시티투어', desc: '가우디 반나절 투어, 바르샤바 구시가지 워킹투어' },
                                                    { id: 'story', label: '여행이야기', desc: '유럽 건축사의 모든 것, 그리스 신화 한방에 끝내기' },
                                                    { id: 'guidebook', label: '가이드북', desc: '파리 리얼 가이드북, 비엔나 포켓 가이드북' },
                                                    { id: 'museum', label: '미술관 / 박물관', desc: '루브르 박물관 투어, 오르세 미술관 투어' }
                                                ].map((cat) => (
                                                    <label key={cat.id} className="flex items-start gap-4 cursor-pointer group p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                                                        <div className={`w-6 h-6 mt-1 border-2 rounded flex items-center justify-center transition-all ${formData.category === cat.id ? "bg-primary border-primary" : "border-slate-200 group-hover:border-primary"
                                                            }`}>
                                                            {formData.category === cat.id && <div className="w-2 h-2 bg-white rounded-sm" />}
                                                        </div>
                                                        <input
                                                            type="radio" className="hidden"
                                                            name="category" value={cat.id}
                                                            checked={formData.category === cat.id}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                                        />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg font-bold text-slate-800">{cat.label}</span>
                                                            </div>
                                                            <p className="text-sm text-slate-400 mt-1">{cat.desc}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-50 w-full" />

                                        {/* 3. 도시 입력 */}
                                        <div className="space-y-6">
                                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">5</div>
                                                도시*
                                            </h3>
                                            <div className="pl-9 space-y-6 max-w-2xl">
                                                <div className="space-y-2">
                                                    <p className="text-sm font-bold text-slate-500">도시명</p>
                                                    <input
                                                        name="city" value={formData.city} onChange={handleFormChange}
                                                        disabled={formData.cityType !== 'normal'}
                                                        type="text" placeholder="도시명을 입력 후 선택하세요."
                                                        className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white outline-none transition-all disabled:opacity-50"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-4">
                                                    {['normal', 'none', 'global'].map((type) => (
                                                        <label key={type} className="flex items-center gap-3 cursor-pointer group w-fit">
                                                            <div className={`w-6 h-6 border-2 rounded flex items-center justify-center transition-all ${formData.cityType === type ? "bg-slate-900 border-slate-900" : "border-slate-200"
                                                                }`}>
                                                                {formData.cityType === type && <CheckCircle2 size={16} className="text-white" />}
                                                            </div>
                                                            <input
                                                                type="radio" className="hidden"
                                                                name="cityType" value={type}
                                                                checked={formData.cityType === type}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, cityType: e.target.value }))}
                                                            />
                                                            <span className="text-slate-700 font-medium">
                                                                {type === 'normal' ? '도시 선택' : type === 'none' ? '해당 도시 없음' : '도시에 한정되지 않음 (국가 or 대륙 관련)'}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep > 1 && (
                                    <div className="min-h-[400px] flex items-center justify-center text-slate-400 italic">
                                        <p>{steps.find(s => s.id === currentStep)?.title} 단계 준비 중입니다.</p>
                                    </div>
                                )}
                            </div>

                            {/* Sticky Footer */}
                            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-[60]">
                                <div className="max-w-[1400px] mx-auto px-8 py-6 flex justify-end gap-4">
                                    <button
                                        onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                                        disabled={currentStep === 1}
                                        className="px-10 py-5 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        이전 단계로
                                    </button>
                                    <button
                                        onClick={() => handleSaveAndNext()}
                                        className="px-16 py-5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center gap-2"
                                    >
                                        {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : null}
                                        {currentStep === steps.length ? "최종 저장 및 완료" : "저장 및 다음 단계로"}
                                    </button>
                                </div>
                            </div>
                        </div>
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
                                                                    <img src={item.thumbnail} alt="" className="w-16 h-16 rounded-xl object-cover border border-surface-border shadow-sm" />
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
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 bg-white border border-surface-border rounded-[40px] shadow-sm">
                        <p className="text-xl font-bold mb-2">준비 중인 서비스입니다.</p>
                        <p className="text-slate-400">후기 관리 및 통계 기능이 곧 업데이트됩니다!</p>
                    </div>
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
