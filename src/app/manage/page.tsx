"use client";

import React, { useState } from "react";
import {
    Plus,
    FileText,
    MessageSquare,
    CheckCircle2,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Search,
    ChevronDown,
    Globe,
    BookOpen,
    PlayCircle,
    X,
    Map,
    ImageIcon,
    Layers,
    XCircle,
    Link as LinkIcon
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
        museumName: "",
        museumLink: "",
        mapType: "",
        // Step 3: E-book specific
        price: "",
        thumbnailUrl: "",
        thumbnailPreview: "",
        galleryUrls: [] as string[],
        galleryPreviews: [] as string[],
        epubUrl: "",
        epubFileName: "",
    });
    const [isCityOpen, setIsCityOpen] = useState(false);

    // Dynamic steps configuration
    const getSteps = () => {
        const baseSteps = [{ id: 1, label: '카테고리 선택' }];

        if (formData.contentType === 'audio_video') {
            baseSteps.push({ id: 2, label: '위치 및 지도 선택' });
            baseSteps.push({ id: 3, label: '상세 페이지 제작' });
            baseSteps.push({ id: 4, label: '심사 과정' });
        } else {
            // E-book path
            baseSteps.push({ id: 2, label: '상세 페이지 제작' });
            baseSteps.push({ id: 3, label: '심사 과정' });
        }
        return baseSteps;
    };

    const steps = getSteps();

    // Pagination state (for management list)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(contents.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = contents.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);


    const handleStepChange = (stepId: number) => {
        if (stepId === currentStep) return;
        if (window.confirm("입력한 내용을 저장하고 이동하시겠습니까?")) {
            handleSaveAndNext(stepId);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'gallery' | 'epub') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const bucket = type === 'epub' ? 'content-files' : 'content-images';
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            if (type === 'thumbnail') {
                setFormData(prev => ({ ...prev, thumbnailUrl: publicUrl, thumbnailPreview: URL.createObjectURL(file) }));
            } else if (type === 'gallery') {
                setFormData(prev => ({
                    ...prev,
                    galleryUrls: [...prev.galleryUrls, publicUrl],
                    galleryPreviews: [...prev.galleryPreviews, URL.createObjectURL(file)]
                }));
            } else {
                setFormData(prev => ({ ...prev, epubUrl: publicUrl, epubFileName: file.name }));
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("파일 업로드 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
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
                        // id: item?.id, 
                        title: formData.title || "무제 콘텐츠",
                        type: formData.contentType,
                        category: formData.category,
                        city: formData.city,
                        description: formData.description,
                        museum_name: formData.museumName,
                        museum_link: formData.museumLink,
                        map_type: formData.mapType,
                        // Step 3 fields
                        price: formData.price.replace(/[^0-9]/g, ''),
                        thumbnail_url: formData.thumbnailUrl,
                        gallery_urls: formData.galleryUrls,
                        epub_url: formData.epubUrl,
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
                                        <div key={step.id} className="flex flex-col items-center group relative cursor-pointer" onClick={() => handleStepChange(step.id)}>
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${currentStep === step.id ? "bg-primary text-white scale-110 shadow-lg shadow-primary/30" : currentStep > step.id ? "bg-slate-900 text-white" : "bg-white text-slate-300 border-2 border-slate-100 group-hover:border-slate-200"}`}>
                                                {currentStep > step.id ? <CheckCircle2 size={24} /> : step.id}
                                            </div>
                                            <span className={`absolute -bottom-8 whitespace-nowrap text-sm font-bold transition-colors ${currentStep === step.id ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-20 pt-10 border-t border-slate-50 text-slate-500 text-sm space-y-1">
                                    <p>• 안내에 따라 콘텐츠 내용을 정확하게 설명해 주세요.</p>
                                    <p>승인을 위한 심사가 진행됩니다.</p>
                                </div>
                            </div>

                            {/* Step Content: Step 1 (Premium UI Overhaul) */}
                            <div className="space-y-8 mb-20">
                                {currentStep === 1 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                        {/* 1. 콘텐츠 유형 Selection Tiles */}
                                        <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-10 space-y-8">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-bold text-slate-900">콘텐츠 유형*</h3>
                                                <span className="text-slate-400 text-sm font-medium">하나를 선택해 주세요</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                {[
                                                    { id: 'electronic_book', label: '전자책', desc: 'PDF, ePub 형식의 텍스트 기반 콘텐츠', icon: BookOpen },
                                                    { id: 'audio_video', label: '오디오 / 비디오', desc: 'MP3, MP4 형식의 멀티미디어 콘텐츠', icon: PlayCircle }
                                                ].map((type) => (
                                                    <button
                                                        key={type.id}
                                                        onClick={() => setFormData(prev => ({ ...prev, contentType: type.id }))}
                                                        className={`relative flex flex-col items-center text-center p-8 rounded-3xl border-2 transition-all duration-300 group ${formData.contentType === type.id
                                                            ? "border-primary bg-primary/[0.03] shadow-lg shadow-primary/5"
                                                            : "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white"
                                                            }`}
                                                    >
                                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 ${formData.contentType === type.id ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "bg-white text-slate-400 group-hover:text-slate-600 shadow-sm"}`}>
                                                            {type.id === 'electronic_book' ? <BookOpen size={32} /> : <PlayCircle size={32} />}
                                                        </div>
                                                        <span className={`text-lg font-bold mb-2 transition-colors ${formData.contentType === type.id ? "text-primary" : "text-slate-900"}`}>{type.label}</span>
                                                        <span className="text-sm text-slate-400 leading-relaxed">{type.desc}</span>
                                                        {formData.contentType === type.id && (
                                                            <div className="absolute top-4 right-4 text-primary animate-in zoom-in-50 duration-300">
                                                                <CheckCircle2 size={24} fill="currentColor" stroke="white" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 2. 카테고리 Selection Tiles */}
                                        <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-10 space-y-8">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-bold text-slate-900">카테고리*</h3>
                                                <span className="text-slate-400 text-sm font-medium">콘텐츠의 성격을 가장 잘 나타내는 항목을 선택해 주세요</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                {[
                                                    { id: 'attraction', label: '명소', desc: '유적지, 랜드마크' },
                                                    { id: 'city_tour', label: '시티투어', desc: '워킹투어, 야경투어' },
                                                    { id: 'story', label: '여행이야기', desc: '지식, 인문학' },
                                                    { id: 'guidebook', label: '가이드북', desc: '리얼 가이드, 매뉴얼' },
                                                    { id: 'museum', label: '미술관 / 박물관', desc: '전시 해설, 추천 동선' }
                                                ].map((cat) => (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                                                        className={`flex flex-col p-6 rounded-2xl border-2 text-left transition-all duration-300 relative ${formData.category === cat.id
                                                            ? "border-primary bg-primary/[0.03] shadow-md shadow-primary/5"
                                                            : "border-slate-50 bg-slate-50/30 hover:border-slate-100 hover:bg-white"
                                                            }`}
                                                    >
                                                        <span className={`text-base font-bold mb-1 ${formData.category === cat.id ? "text-primary" : "text-slate-800"}`}>{cat.label}</span>
                                                        <span className="text-xs text-slate-400 line-clamp-1">{cat.desc}</span>
                                                        {formData.category === cat.id && (
                                                            <div className="absolute top-4 right-4 text-primary scale-75">
                                                                <CheckCircle2 size={24} fill="currentColor" stroke="white" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 3. 도시 입력 (Improved Searchable Input) */}
                                        <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-10 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-bold text-slate-900">도시*</h3>
                                                <div className="flex gap-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newType = formData.cityType === 'global' ? 'normal' : 'global';
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                cityType: newType,
                                                                city: newType === 'global' ? '전세계' : ''
                                                            }));
                                                            if (newType === 'global') setIsCityOpen(false);
                                                        }}
                                                        className="flex items-center gap-2 cursor-pointer group"
                                                    >
                                                        <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all ${formData.cityType === 'global' ? "bg-slate-900 border-slate-900" : "border-slate-200"}`}>
                                                            {formData.cityType === 'global' && <CheckCircle2 size={12} className="text-white" />}
                                                        </div>
                                                        <span className={`text-sm font-medium transition-colors ${formData.cityType === 'global' ? "text-slate-900" : "text-slate-500 group-hover:text-slate-800"}`}>
                                                            전세계 대상
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="relative max-w-2xl">
                                                <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all duration-300 ${formData.cityType === 'global' ? 'opacity-40 cursor-not-allowed bg-slate-50 border-transparent' : isCityOpen ? 'border-primary bg-white shadow-xl shadow-primary/5' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}>
                                                    <Search size={20} className={isCityOpen ? "text-primary" : "text-slate-400"} />
                                                    <input
                                                        name="city" value={formData.cityType === 'global' ? "" : formData.city}
                                                        onFocus={() => formData.cityType === 'normal' && setIsCityOpen(true)}
                                                        onBlur={() => setTimeout(() => setIsCityOpen(false), 200)}
                                                        onChange={(e) => {
                                                            setFormData(prev => ({ ...prev, city: e.target.value, cityType: 'normal' }));
                                                            setIsCityOpen(true);
                                                        }}
                                                        disabled={formData.cityType === 'global'}
                                                        type="text" placeholder={formData.cityType === 'global' ? "전세계 대상으로 설정되었습니다." : "도시명을 검색하거나 입력해 주세요."}
                                                        className="flex-1 bg-transparent outline-none text-base font-medium text-slate-800 placeholder:text-slate-300 disabled:cursor-not-allowed"
                                                    />
                                                    {formData.cityType === 'normal' && <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isCityOpen ? 'rotate-180' : ''}`} />}
                                                </div>

                                                {/* Mock Search Results dropdown - Higher Z-index */}
                                                {isCityOpen && formData.city.length > 0 && formData.cityType === 'normal' && (
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-surface-border shadow-2xl p-3 z-[100] animate-in slide-in-from-top-2 duration-200">
                                                        <div className="p-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">추천 도시</div>
                                                        {['파리', '런던', '도쿄', '뉴욕', '바르셀로나'].filter(c => c.includes(formData.city)).map((c) => (
                                                            <button
                                                                key={c}
                                                                onMouseDown={() => {
                                                                    setFormData(prev => ({ ...prev, city: c }));
                                                                    setIsCityOpen(false);
                                                                }}
                                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors text-left"
                                                            >
                                                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                                    <Globe size={16} />
                                                                </div>
                                                                <span className="text-base font-bold text-slate-800">{c}</span>
                                                            </button>
                                                        ))}
                                                        <button
                                                            onMouseDown={() => setIsCityOpen(false)}
                                                            className="w-full flex items-center gap-3 px-4 py-3 border-t border-slate-50 hover:bg-slate-50 rounded-xl transition-colors text-left mt-1"
                                                        >
                                                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                                                <Edit2 size={16} />
                                                            </div>
                                                            <div>
                                                                <span className="text-base font-bold text-slate-800">&quot;{formData.city}&quot; 직접 입력</span>
                                                                <p className="text-[10px] text-slate-400 mt-0.5">새로운 도시로 등록합니다</p>
                                                            </div>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {formData.contentType === 'audio_video' && currentStep === 2 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                        {/* 1. 미술관 / 박물관 정보 (Conditional) */}
                                        {formData.category === 'museum' && (
                                            <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-10 space-y-8">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xl font-bold text-slate-900 italic">미술관 / 박물관 정보*</h3>
                                                    <span className="text-slate-400 text-sm font-medium">정확한 장소 정보를 입력해 주세요</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-3">
                                                        <label className="text-sm font-bold text-slate-500 ml-1">기관명</label>
                                                        <div className="relative group">
                                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                                                <Search size={18} />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                placeholder="기관명을 검색하거나 입력하세요"
                                                                value={formData.museumName}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, museumName: e.target.value }))}
                                                                className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 outline-none transition-all placeholder:text-slate-300 font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-sm font-bold text-slate-500 ml-1">공식 홈페이지 링크 (선택)</label>
                                                        <div className="relative group">
                                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                                                <LinkIcon size={18} />
                                                            </div>
                                                            <input
                                                                type="url"
                                                                placeholder="https://..."
                                                                value={formData.museumLink}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, museumLink: e.target.value }))}
                                                                className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 outline-none transition-all placeholder:text-slate-300 font-medium"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 2. 지도 활용 (Map Selection Tiles) */}
                                        <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-10 space-y-8">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-bold text-slate-900">지도 활용*</h3>
                                                    <p className="text-slate-400 text-sm font-medium">여행자가 길을 찾으려면 어떤 지도가 필요한가요?</p>
                                                </div>
                                                <button
                                                    onClick={() => window.open('https://www.tourlive.co.kr', '_blank')}
                                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                                                >
                                                    예시 보기
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {[
                                                    { id: 'google_map', label: '외부 구글맵', desc: '팔라티노 언덕 투어, 폼페이 투어 등 명소 가이드', icon: Map },
                                                    { id: 'image_map', label: '내부 이미지 지도', desc: '대영 박물관, 우피치 미술관 등 실내 가이드', icon: ImageIcon },
                                                    { id: 'both', label: '외부, 내부 모두 사용', desc: '베르사유 투어, 가우디 반일투어 등 복합 가이드', icon: Layers },
                                                    { id: 'none', label: '필요하지 않음', desc: '여행이야기, 가이드북, 인문학 콘텐츠 등', icon: XCircle }
                                                ].map((map) => (
                                                    <button
                                                        key={map.id}
                                                        onClick={() => setFormData(prev => ({ ...prev, mapType: map.id }))}
                                                        className={`flex gap-5 p-6 rounded-[24px] border-2 text-left transition-all duration-300 relative ${formData.mapType === map.id
                                                            ? "border-primary bg-primary/[0.03] shadow-lg shadow-primary/5"
                                                            : "border-slate-100 bg-slate-50/30 hover:border-slate-200 hover:bg-white"
                                                            }`}
                                                    >
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${formData.mapType === map.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-slate-400 border border-slate-100 shadow-sm"}`}>
                                                            <map.icon size={22} />
                                                        </div>
                                                        <div className="flex-1 pr-6">
                                                            <span className={`block text-lg font-bold mb-1 ${formData.mapType === map.id ? "text-primary" : "text-slate-800"}`}>{map.label}</span>
                                                            <span className="text-sm text-slate-400 leading-snug">{map.desc}</span>
                                                        </div>
                                                        {formData.mapType === map.id && (
                                                            <div className="absolute top-4 right-4 text-primary animate-in zoom-in-50 duration-300">
                                                                <CheckCircle2 size={24} fill="currentColor" stroke="white" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="bg-slate-50/80 rounded-2xl p-6 space-y-2">
                                                <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                                                    여행자가 길을 찾으려면 어떤 지도가 필요한가요?
                                                </p>
                                                <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                                                    예시를 통해 자세히 알아보세요.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {((currentStep === 3 && formData.contentType === 'audio_video') || (currentStep === 2 && formData.contentType === 'electronic_book')) && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                        {formData.contentType === 'electronic_book' ? (
                                            <>
                                                {/* 1. 콘텐츠 이름 */}
                                                <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-10 space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-xl font-bold text-slate-900">콘텐츠 이름*</h3>
                                                        <span className={`text-sm font-medium ${formData.title.length > 50 ? 'text-red-500' : 'text-slate-400'}`}>
                                                            {formData.title.length}/50
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <input
                                                            type="text"
                                                            maxLength={50}
                                                            placeholder="콘텐츠 이름을 입력해 주세요."
                                                            value={formData.title}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                                            className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 outline-none transition-all font-medium text-lg"
                                                        />
                                                        <div className="text-xs text-slate-400 space-y-1 ml-1 leading-relaxed">
                                                            <p>• 50자 제한 / 이모티콘 및 특수문자 사용 불가</p>
                                                            <p>• 등록하시고자 하는 콘텐츠의 특성과 지역이 잘 드러나는 키워드를 사용해 주세요.</p>
                                                            <p>• 기존 콘텐츠 이름과 중복될 시 콘텐츠 등록이 반려됩니다.</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 2. 콘텐츠 소개글 */}
                                                <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-10 space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-xl font-bold text-slate-900">콘텐츠 소개글*</h3>
                                                        <span className={`text-sm font-medium ${formData.description.length < 500 || formData.description.length > 1000 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                            {formData.description.length} / 1000자 (최소 500자)
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <textarea
                                                            placeholder={`<소개글 작성 추천 요소>\n• 이 투어가 왜 특별한지\n• 이 장소를 왜 추천하는지, 그리고 그냥 방문하면 무엇을 놓치게 되는지\n• 이 투어를 통해 여행자가 무엇을 알고 무엇을 느끼게 될지\n• 이 투어가 어떤 방식으로 진행되는지, 어떤 포인트를 다루는지\n• 어떤 여행자에게 특히 잘 맞는지\n\n[예시]\n우피치 미술관은 르네상스가 태어난 도시 피렌체를 대표하는 세계 최고의 미술관입니다.\n하지만 수많은 명화 속에 담긴 의미와 이야기를 모르고 보면, 그냥 '유명한 그림들'로만 지나치기 쉽습니다.\n이 투어는 르네상스 시대 사람들의 생각이 어떻게 바뀌었는지, 화가들이 그것을 어떻게 그림 속에 담아냈는지를 작품과 함께 쉽고 재미있게 풀어드립니다.`}
                                                            value={formData.description}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                            className="w-full px-6 py-6 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 outline-none transition-all font-medium text-base min-h-[400px] leading-relaxed resize-none"
                                                        />
                                                        <p className="text-xs text-slate-400 ml-1">• 최소 500자 최대 1000자 제한 (공백포함)</p>
                                                    </div>
                                                </div>

                                                {/* 3. 콘텐츠 가격 */}
                                                <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-10 space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-xl font-bold text-slate-900">콘텐츠 가격*</h3>
                                                        <button className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-50 transition-colors">가이드라인</button>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative flex-1 max-w-xs group">
                                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-900 font-bold">₩</div>
                                                            <input
                                                                type="text"
                                                                placeholder="가격 입력"
                                                                value={formData.price}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                                                    setFormData(prev => ({ ...prev, price: val ? Number(val).toLocaleString() : '' }));
                                                                }}
                                                                className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 outline-none transition-all font-bold text-lg text-right"
                                                            />
                                                        </div>
                                                        <span className="text-slate-400 font-medium">KRW (₩) 기준</span>
                                                    </div>
                                                </div>

                                                {/* 4. 이미지 업로드 */}
                                                <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-10 space-y-8">
                                                    <div className="space-y-1">
                                                        <h3 className="text-xl font-bold text-slate-900">이미지 업로드*</h3>
                                                        <div className="text-xs text-slate-400 space-y-1 leading-relaxed">
                                                            <p>• 사용 환경에 따라 사진이 잘려 보일 수 있습니다. (권장 규격 1200*645) 용량 5mb 미만</p>
                                                            <p>• 첫 사진이 대표사진(썸네일)으로 자동 지정됩니다.</p>
                                                            <p>• 최소 1장, 최대 3장까지 사진 등록이 가능합니다.</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-4 max-w-2xl">
                                                        {/* Thumbnail */}
                                                        <div className="group relative flex items-center gap-6 p-6 rounded-3xl border-2 border-primary/20 bg-primary/5 hover:border-primary/40 transition-all">
                                                            <div className="w-32 h-20 rounded-xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center text-slate-300">
                                                                {formData.thumbnailPreview ? (
                                                                    <img src={formData.thumbnailPreview} className="w-full h-full object-cover" alt="" />
                                                                ) : <ImageIcon size={32} />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="block text-base font-bold text-slate-900 mb-1">대표사진*</span>
                                                                <div className="flex items-center gap-3">
                                                                    <label className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm rounded-xl transition-all cursor-pointer">
                                                                        파일 선택
                                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'thumbnail')} />
                                                                    </label>
                                                                    {formData.thumbnailPreview && (
                                                                        <div className="flex gap-2">
                                                                            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><Layers size={20} /></button>
                                                                            <button
                                                                                onClick={() => setFormData(prev => ({ ...prev, thumbnailUrl: "", thumbnailPreview: "" }))}
                                                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                                            >
                                                                                <XCircle size={20} />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Gallery 1 */}
                                                        <div className="group relative flex items-center gap-6 p-6 rounded-3xl border-2 border-slate-100 bg-slate-50/50 hover:border-slate-200 transition-all">
                                                            <div className="w-32 h-20 rounded-xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center text-slate-300">
                                                                {formData.galleryPreviews[0] ? (
                                                                    <img src={formData.galleryPreviews[0]} className="w-full h-full object-cover" alt="" />
                                                                ) : <ImageIcon size={32} />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="block text-base font-bold text-slate-900 mb-1">이미지1</span>
                                                                <div className="flex items-center gap-3">
                                                                    <label className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-sm rounded-xl transition-all cursor-pointer">
                                                                        파일 선택
                                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'gallery')} />
                                                                    </label>
                                                                    {formData.galleryPreviews[0] && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setFormData(prev => ({
                                                                                    ...prev,
                                                                                    galleryUrls: prev.galleryUrls.filter((_, i) => i !== 0),
                                                                                    galleryPreviews: prev.galleryPreviews.filter((_, i) => i !== 0)
                                                                                }));
                                                                            }}
                                                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                                        >
                                                                            <XCircle size={20} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Gallery 2 */}
                                                        <div className="group relative flex items-center gap-6 p-6 rounded-3xl border-2 border-slate-100 bg-slate-50/50 hover:border-slate-200 transition-all">
                                                            <div className="w-32 h-20 rounded-xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center text-slate-300">
                                                                {formData.galleryPreviews[1] ? (
                                                                    <img src={formData.galleryPreviews[1]} className="w-full h-full object-cover" alt="" />
                                                                ) : <ImageIcon size={32} />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="block text-base font-bold text-slate-900 mb-1">이미지2</span>
                                                                <div className="flex items-center gap-3">
                                                                    <label className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-sm rounded-xl transition-all cursor-pointer">
                                                                        파일 선택
                                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'gallery')} />
                                                                    </label>
                                                                    {formData.galleryPreviews[1] && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setFormData(prev => ({
                                                                                    ...prev,
                                                                                    galleryUrls: prev.galleryUrls.filter((_, i) => i !== 1),
                                                                                    galleryPreviews: prev.galleryPreviews.filter((_, i) => i !== 1)
                                                                                }));
                                                                            }}
                                                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                                        >
                                                                            <XCircle size={20} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 5. epub 파일 업로드 */}
                                                <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-10 space-y-6">
                                                    <h3 className="text-xl font-bold text-slate-900">epub 파일 업로드*</h3>
                                                    <div className="flex items-center gap-4">
                                                        <label className="px-10 py-6 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-lg rounded-2xl transition-all flex items-center gap-3 border-2 border-dashed border-primary/30 cursor-pointer">
                                                            {formData.epubFileName ? <FileText size={24} /> : <Plus size={24} />}
                                                            {formData.epubFileName || "파일 선택"}
                                                            <input type="file" className="hidden" accept=".epub" onChange={(e) => handleFileUpload(e, 'epub')} />
                                                        </label>
                                                        {formData.epubFileName && (
                                                            <button
                                                                onClick={() => setFormData(prev => ({ ...prev, epubUrl: "", epubFileName: "" }))}
                                                                className="p-3 text-slate-300 hover:text-red-500 transition-colors"
                                                            >
                                                                <XCircle size={24} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="bg-white rounded-[40px] border border-surface-border shadow-sm p-12">
                                                <h3 className="text-2xl font-bold text-slate-900 mb-6">오디오 / 비디오 상세 제작</h3>
                                                <p className="text-slate-500 text-lg leading-relaxed">
                                                    오디오 / 비디오 콘텐츠를 위한 상세 제작 단계입니다.<br />
                                                    현재 기능 구현 준비 중입니다. 잠시만 기다려 주세요!
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {currentStep === steps.length && currentStep > 2 && (
                                    <div className="bg-white rounded-[40px] border border-surface-border shadow-sm p-12 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <h3 className="text-2xl font-bold text-slate-900 mb-6">심사 과정 안내</h3>
                                        <p className="text-slate-500 text-lg leading-relaxed">
                                            제출하신 콘텐츠는 3~5 영업일 이내에 담당자의 심사를 거쳐 결과가 안내됩니다.<br />
                                            심사 통과 시 투어라이브 앱에 즉시 공개됩니다.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Sticky Footer (Compact Height & Blur) */}
                            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] z-50">
                                <div className="max-w-[1400px] mx-auto px-10 py-3 flex justify-end gap-3">
                                    <button
                                        onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                                        disabled={currentStep === 1}
                                        className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-20 disabled:hover:bg-transparent text-sm"
                                    >
                                        이전 단계로
                                    </button>
                                    <button
                                        onClick={() => handleSaveAndNext()}
                                        className="px-10 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] flex items-center gap-2 text-sm"
                                    >
                                        {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : null}
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
