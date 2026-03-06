"use client";

import React, { useState } from "react";
import {
    Plus,
    FileText,
    CheckCircle2,
    Edit2,
    Search,
    ChevronDown,
    Globe,
    BookOpen,
    PlayCircle,
    ImageIcon,
    Layers,
    XCircle,
    Map
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ContentPayload {
    id?: string | number;
    title: string;
    type: string;
    category: string;
    city: string;
    description: string;
    museum_name: string;
    museum_link: string;
    map_type: string;
    price: string | null;
    thumbnail_url: string | null;
    gallery_urls: string[] | null;
    epub_url: string | null;
    status: string;
    updated_at: string;
}

interface ContentRegistrationFormProps {
    onBack: () => void;
    onList: () => void;
    onRefresh: () => Promise<void>;
}

export default function ContentRegistrationForm({ onBack, onList, onRefresh }: ContentRegistrationFormProps) {
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
        // Step 3/4 A/V specific
        spots: [
            { id: 1, name: "루브르 박물관 앞 유리 피라미드", mapType: "google_map" },
            { id: 2, name: "모나리자 전시실", mapType: "image_map" }
        ] as { id: number, name: string, mapType: string }[],
        tracks: [
            { id: 1, spot_id: 1, title: "트랙명 1", description: "", audio_url: "", script: "", is_free: false, order_index: 1 },
            { id: 2, spot_id: 2, title: "트랙명 2", description: "", audio_url: "", script: "이미 작성된 트랙 2의 예시 스크립트입니다...", is_free: false, order_index: 2 },
            { id: 3, spot_id: 2, title: "트랙명 3", description: "", audio_url: "", script: "", is_free: false, order_index: 3 }
        ] as any[]
    });
    const [contentId, setContentId] = useState<string | number | null>(null);
    const [isCityOpen, setIsCityOpen] = useState(false);
    const [activeTrackId, setActiveTrackId] = useState<number>(2); // Mocking Track 2 selected as in original UI

    // Dynamic steps configuration
    const getSteps = () => {
        if (formData.contentType === 'electronic_book') {
            return [
                { id: 1, label: '카테고리 선택' },
                { id: 3, label: '상세 페이지 제작' },
                { id: 5, label: '등록 완료' }
            ];
        }

        const base = [
            { id: 1, label: '카테고리 선택' },
            { id: 2, label: '위치 및 지도 선택' }
        ];

        if (formData.mapType !== 'none') {
            base.push({ id: 3, label: '위치 설정' });
        }
        base.push({ id: 4, label: '트랙 제작' });
        base.push({ id: 5, label: '등록 완료' });

        return base;
    };

    const steps = getSteps();

    const handleStepChange = (stepId: number) => {
        if (stepId === currentStep) return;
        if (window.confirm("입력한 내용을 저장하고 이동하시겠습니까?")) {
            handleSaveAndNext(stepId);
        }
    };

    const uploadToBucket = async (file: File, bucket: string = 'contents') => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'gallery' | 'epub' | 'track') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const bucket = type === 'epub' ? 'content-files' : type === 'track' ? 'contents' : 'content-images';
            const publicUrl = await uploadToBucket(file, bucket);

            if (type === 'thumbnail') {
                setFormData(prev => ({ ...prev, thumbnailUrl: publicUrl, thumbnailPreview: URL.createObjectURL(file) }));
            } else if (type === 'gallery') {
                setFormData(prev => ({
                    ...prev,
                    galleryUrls: [...prev.galleryUrls, publicUrl],
                    galleryPreviews: [...prev.galleryPreviews, URL.createObjectURL(file)]
                }));
            } else if (type === 'track') {
                setFormData(prev => ({
                    ...prev,
                    tracks: prev.tracks.map(t => t.id === activeTrackId ? { ...t, audio_url: publicUrl } : t)
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

    const saveData = async () => {
        setLoading(true);
        try {
            // 1. Save/Update Content (Ensure we have a content_id)
            let currentContentId = contentId;
            if (!currentContentId) {
                const { data, error } = await supabase
                    .from('contents')
                    .insert([{
                        title: formData.title || "무제 콘텐츠",
                        type: formData.contentType,
                        category: formData.category,
                        city: formData.city,
                        description: formData.description,
                        museum_name: formData.museumName,
                        museum_link: formData.museumLink,
                        map_type: formData.mapType,
                        status: 'Draft'
                    }])
                    .select()
                    .single();

                if (error) throw error;
                currentContentId = data.id;
                setContentId(data.id);
            }

            // 2. Save Spots sequentially
            const spotIdMap: Record<number, string> = {};
            if (formData.spots.length > 0) {
                const spotsToInsert = formData.spots.map(s => ({
                    content_id: currentContentId,
                    name: s.name,
                    map_type: s.mapType,
                    coordinates: {}
                }));

                const { data: savedSpots, error: spotsError } = await supabase
                    .from('spots')
                    .insert(spotsToInsert)
                    .select();

                if (spotsError) throw spotsError;

                savedSpots.forEach((spot, idx) => {
                    spotIdMap[formData.spots[idx].id] = spot.id;
                });
            }

            // 3. Save Tracks using saved spot IDs
            if (formData.tracks.length > 0) {
                const tracksToInsert = formData.tracks.map(t => ({
                    content_id: currentContentId,
                    spot_id: t.spot_id && t.spot_id !== 'none' ? spotIdMap[t.spot_id] : null,
                    title: t.title,
                    description: t.description,
                    audio_url: t.audio_url,
                    script: t.script,
                    is_free: t.is_free,
                    order_index: t.order_index
                }));

                const { error: tracksError } = await supabase
                    .from('tracks')
                    .insert(tracksToInsert);

                if (tracksError) throw tracksError;
            }

            return true;
        } catch (error) {
            console.error("Save error:", error);
            alert("데이터 저장 중 오류가 발생했습니다.");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAndNext = async (nextStep?: number) => {
        // If final step (Step 4 for A/V or Step 3 for E-book), call saveData
        const isFinalStep = (formData.contentType === 'electronic_book' && currentStep === 3) ||
            (formData.contentType !== 'electronic_book' && currentStep === 4);

        if (isFinalStep) {
            const success = await saveData();
            if (!success) return;
        }

        if (nextStep) {
            setCurrentStep(nextStep);
        } else {
            if (currentStep === 1) {
                if (formData.contentType === 'electronic_book') {
                    setCurrentStep(3); // Skip Step 2
                } else {
                    setCurrentStep(2);
                }
            } else if (currentStep === 2) {
                if (formData.mapType === 'none') {
                    setCurrentStep(4);
                } else {
                    setCurrentStep(3);
                }
            } else if (currentStep === 3) {
                if (formData.contentType === 'electronic_book') {
                    setCurrentStep(5);
                } else {
                    setCurrentStep(4);
                }
            } else if (currentStep === 4) {
                setCurrentStep(5);
            } else {
                setCurrentStep((prev) => Math.min(prev + 1, 5));
            }
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex items-center justify-between py-10">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">콘텐츠 등록 및 수정</h2>
                <button
                    onClick={onBack}
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
                        style={{ width: `${steps.length > 1 ? (Math.max(0, steps.findIndex(s => s.id === currentStep)) / (steps.length - 1)) * 100 : 0}%` }}
                    />

                    {steps.map((step, index) => (
                        <div key={step.id} className="flex flex-col items-center group relative cursor-pointer" onClick={() => handleStepChange(step.id)}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${currentStep === step.id ? "bg-primary text-white scale-110 shadow-lg shadow-primary/30" : steps.findIndex(s => s.id === currentStep) > index ? "bg-slate-900 text-white" : "bg-white text-slate-300 border-2 border-slate-100 group-hover:border-slate-200"}`}>
                                {steps.findIndex(s => s.id === currentStep) > index ? <CheckCircle2 size={24} /> : (index + 1)}
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


                {currentStep === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* 1. 박물관/미술관 전용 (Only if category is museum) */}
                        {formData.category === "museum" && (
                            <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-10 space-y-8">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-slate-900">시설 정보*</h3>
                                    <p className="text-slate-400 text-sm font-medium">박물관 또는 미술관의 정보를 입력해 주세요.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-slate-500 ml-1">기관명 (검색/입력)</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                                <Search size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="기관 이름을 입력하세요"
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
                                                <Layers size={18} className="rotate-45" />
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
                                    { id: 'google_map', label: '외부 구글맵', desc: '팔라티노 언덕 투어, 폼페이 투어 등 명소 가이드', icon: Globe },
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
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
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

                                {/* 5. 콘텐츠 파일 업로드 */}
                                <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-10 space-y-6">
                                    <h3 className="text-xl font-bold text-slate-900">
                                        {formData.contentType === 'electronic_book' ? 'epub 파일 업로드*' : '콘텐츠 파일 업로드*'}
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <label className="px-10 py-6 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-lg rounded-2xl transition-all flex items-center gap-3 border-2 border-dashed border-primary/30 cursor-pointer">
                                            {formData.epubFileName ? <FileText size={24} /> : <Plus size={24} />}
                                            {formData.epubFileName || "파일 선택"}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept={formData.contentType === 'electronic_book' ? ".epub" : "audio/*,video/*"}
                                                onChange={(e) => handleFileUpload(e, 'epub')}
                                            />
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
                                    <p className="text-xs text-slate-400 ml-1">
                                        {formData.contentType === 'electronic_book'
                                            ? '• .epub 형식의 파일만 업로드 가능합니다.'
                                            : '• 오디오(.mp3) 또는 비디오 콘텐츠 파일을 업로드해 주세요.'}
                                    </p>
                                </div>
                            </>
                        ) : (
                            /* Audio/Video Location Setup UI */
                            <div className="space-y-8">
                                {/* Google Map Section (Shown if google_map or both) */}
                                {(formData.mapType === 'google_map' || formData.mapType === 'both') && (
                                    <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-10 space-y-6">
                                        <div className="space-y-1 mb-8">
                                            <h3 className="text-xl font-bold text-slate-900">
                                                외부 구글맵 설정 {formData.mapType === 'both' ? '(스팟 지정)' : ''}
                                            </h3>
                                            <p className="text-slate-400 text-sm">콘텐츠가 재생될 외부 위치를 지도에 핀으로 표시해 주세요.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-[500px]">
                                            {/* Left: Points List */}
                                            <div className="col-span-1 md:col-span-4 border-r border-slate-100 pr-6 space-y-4 overflow-y-auto custom-scrollbar">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-slate-900">외부 스팟 목록</span>
                                                    <button className="text-sm font-bold text-primary flex items-center gap-1 bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-lg">
                                                        <Plus size={16} /> 스팟 추가
                                                    </button>
                                                </div>
                                                {/* Mock Google Points */}
                                                {formData.spots.filter(s => s.mapType === 'google_map').map((spot, idx) => (
                                                    <div key={spot.id} className="p-4 rounded-xl border-2 border-primary bg-primary/[0.03] space-y-3 shadow-sm shadow-primary/5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-primary text-sm flex items-center gap-2">
                                                                <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">{idx + 1}</div>
                                                                스팟 {idx + 1}
                                                            </span>
                                                            <button className="text-slate-400 hover:text-red-500 transition-colors"><XCircle size={16} /></button>
                                                        </div>
                                                        <input type="text" placeholder="스팟 이름" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary font-medium" defaultValue={spot.name} />
                                                    </div>
                                                ))}
                                                {/* Empty State Mock */}
                                                {formData.spots.filter(s => s.mapType === 'google_map').length === 0 && (
                                                    <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                                                        <p className="text-sm text-slate-400 font-medium">우측 지도에서 위치를 클릭해<br />새 스팟을 추가하세요.</p>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Right: Google Map View Placeholder */}
                                            <div className="col-span-1 md:col-span-8 bg-slate-50 rounded-2xl border-2 border-slate-100 flex flex-col items-center justify-center relative overflow-hidden group">
                                                <div className="text-center space-y-4">
                                                    <div className="w-20 h-20 bg-white rounded-2xl border border-slate-200 flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                                                        <Globe size={32} className="text-slate-300" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="font-bold text-slate-700 text-lg">Google Map View (API Placeholder)</p>
                                                        <p className="text-sm text-slate-400">화면을 클릭해 지도 위에 외부 스팟을 지정하세요.</p>
                                                    </div>
                                                </div>
                                                {/* Mock Pin */}
                                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                    <div className="relative">
                                                        <Map size={48} className="text-primary opacity-20" />
                                                        <div className="absolute -top-4 -left-4 w-6 h-6 bg-primary rounded-full shadow-lg border-2 border-white flex items-center justify-center z-10 animate-bounce">
                                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Image Map Section (Shown if image_map or both) */}
                                {(formData.mapType === 'image_map' || formData.mapType === 'both') && (
                                    <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-10 space-y-6">
                                        <div className="space-y-1 mb-8">
                                            <h3 className="text-xl font-bold text-slate-900">
                                                내부 이미지 지도 설정 {formData.mapType === 'both' ? '(스팟 지정)' : ''}
                                            </h3>
                                            <p className="text-slate-400 text-sm">플로어플랜 등 내부 지도 이미지를 업로드하고 스팟을 표시해 주세요.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-[500px]">
                                            {/* Left: Points List */}
                                            <div className="col-span-1 md:col-span-4 border-r border-slate-100 pr-6 space-y-4 overflow-y-auto custom-scrollbar">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-slate-900">내부 스팟 목록</span>
                                                    <button className="text-sm font-bold text-[#FF9B50] flex items-center gap-1 bg-orange-50 hover:bg-orange-100 transition-colors px-3 py-1.5 rounded-lg">
                                                        <Plus size={16} /> 스팟 추가
                                                    </button>
                                                </div>
                                                {/* Mock Image Points */}
                                                {formData.spots.filter(s => s.mapType === 'image_map').map((spot, idx) => (
                                                    <div key={spot.id} className="p-4 rounded-xl border-2 border-[#FFD1A6] bg-[#FFD1A6]/10 space-y-3 shadow-sm shadow-orange-500/5 cursor-pointer">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-[#D97706] text-sm flex items-center gap-2">
                                                                <div className="w-5 h-5 rounded-full bg-[#FF9B50] text-white flex items-center justify-center text-[10px]">{idx + 1}</div>
                                                                스팟 {idx + 1}
                                                            </span>
                                                            <button className="text-slate-400 hover:text-red-500 transition-colors"><XCircle size={16} /></button>
                                                        </div>
                                                        <input type="text" placeholder="스팟 이름" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#FF9B50] font-medium" defaultValue={spot.name} />
                                                    </div>
                                                ))}
                                                {/* Add new mock spot visually */}
                                                <div className="p-4 rounded-xl border-2 border-slate-100 bg-slate-50 space-y-3 hover:border-slate-200 transition-colors cursor-pointer">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px]">
                                                                {formData.spots.filter(s => s.mapType === 'image_map').length + 1}
                                                            </div>
                                                            새 스팟
                                                        </span>
                                                        <button className="text-slate-400 hover:text-red-500 transition-colors"><XCircle size={16} /></button>
                                                    </div>
                                                    <input type="text" placeholder="스팟 이름 입력" className="w-full px-3 py-2 bg-white/50 border border-transparent rounded-lg text-sm outline-none pointer-events-none" />
                                                </div>
                                            </div>
                                            {/* Right: Image Upload & View Placeholder */}
                                            <div className="col-span-1 md:col-span-8 bg-slate-50 rounded-2xl border-2 border-slate-100 flex flex-col items-center justify-center relative overflow-hidden group hover:border-[#FF9B50]/30 transition-colors">
                                                <div className="text-center space-y-5">
                                                    <div className="w-20 h-20 bg-white rounded-2xl border border-slate-200 flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                                                        <ImageIcon size={32} className="text-slate-300" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="font-bold text-slate-700 text-lg">내부 지도 이미지 업로드</p>
                                                        <p className="text-sm text-slate-400">지도 이미지를 업로드 후 화면을 클릭해 내부 스팟을 지정하세요.</p>
                                                    </div>
                                                    <button className="px-6 py-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md text-sm font-bold text-slate-700 transition-all active:scale-95">이미지 선택</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500 relative">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Left: Sidebar Track List (Sticky) */}
                            <div className="w-full md:w-1/3 sticky top-10 flex flex-col bg-white rounded-[32px] border border-surface-border shadow-sm p-8 h-[calc(100vh-200px)] overflow-hidden">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Map size={20} className="text-primary" /> 투어 트랙</h3>
                                    <div className="flex gap-2">
                                        <button className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"><Plus size={16} /></button>
                                        <button className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"><XCircle size={16} /></button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                    {/* Chapters & Tracks list from state */}
                                    <div className="space-y-2">
                                        <div className="bg-slate-50 rounded-xl p-4 font-bold text-sm text-slate-800 flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                                            <ChevronDown size={16} className="text-slate-400" /> 기본 챕터
                                        </div>
                                        <div className="ml-4 pl-4 border-l-2 border-slate-50 space-y-2">
                                            {formData.tracks.map((track) => (
                                                <div
                                                    key={track.id}
                                                    onClick={() => setActiveTrackId(track.id)}
                                                    className={`p-3 border rounded-xl text-sm font-medium flex items-center justify-between gap-3 cursor-pointer transition-all shadow-sm ${activeTrackId === track.id ? 'border-primary bg-primary/[0.03] font-bold text-primary shadow-primary/5' : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-3 h-3 rounded-full ${activeTrackId === track.id ? 'border-2 border-primary' : 'bg-slate-200'}`}></div>
                                                        <span>{track.title}</span>
                                                    </div>
                                                    {track.audio_url && <CheckCircle2 size={16} className="text-[#FF9B50]" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-100 text-right text-sm font-bold text-[#FF9B50] flex items-center justify-end gap-2">
                                    <CheckCircle2 size={16} /> 트랙 완성률 (1/3)
                                </div>
                            </div>

                            {/* Right: Track Content Form (Independently Scrollable) */}
                            <div className="w-full md:w-2/3 bg-white rounded-[32px] border border-surface-border shadow-sm p-10 h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                                <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4 mb-8 flex items-center justify-between">
                                    오디오 / 비디오 가이드 제작
                                    <span className="text-sm font-medium text-slate-400">트랙 {activeTrackId} 편집 중</span>
                                </h3>

                                <div className="space-y-10">
                                    {/* Link to Spot Dropdown (Conditional) */}
                                    {formData.mapType !== 'none' && (
                                        <div className="space-y-4">
                                            <label className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                연결할 스팟 선택*
                                                <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">필수</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={formData.tracks.find(t => t.id === activeTrackId)?.spot_id || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            tracks: prev.tracks.map(t => t.id === activeTrackId ? { ...t, spot_id: val === 'none' ? 'none' : Number(val) } : t)
                                                        }));
                                                    }}
                                                    className="appearance-none w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 outline-none transition-all font-medium text-slate-700 cursor-pointer"
                                                >
                                                    <option value="">트랙이 재생될 스팟을 선택해 주세요</option>
                                                    {formData.spots.map(spot => (
                                                        <option key={spot.id} value={spot.id}>
                                                            {spot.name} {spot.mapType === 'google_map' ? '(외부지도)' : '(내부지도)'}
                                                        </option>
                                                    ))}
                                                    <option value="none">스팟과 연결하지 않음 (이동 중 감상 등)</option>
                                                </select>
                                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Track File */}
                                    <div className="space-y-4">
                                        <label className="font-bold text-slate-800 text-sm">트랙 파일*</label>
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 p-6 rounded-2xl border-2 border-slate-100 bg-slate-50/50">
                                            <label className="px-6 py-3.5 bg-[#FFD1A6] text-[#D97706] font-bold rounded-xl hover:bg-[#FFC691] transition-all active:scale-95 whitespace-nowrap shadow-sm shadow-orange-500/10 cursor-pointer">
                                                파일 업로드
                                                <input type="file" className="hidden" accept="audio/*,video/*" onChange={(e) => handleFileUpload(e, 'track')} />
                                            </label>
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-bold text-slate-700 truncate max-w-[200px]">
                                                        {formData.tracks.find(t => t.id === activeTrackId)?.audio_url ? "파일 업로드됨" : "파일을 선택해 주세요"}
                                                    </span>
                                                    <div className="flex items-center gap-4 text-slate-400">
                                                        {formData.tracks.find(t => t.id === activeTrackId)?.audio_url && <PlayCircle size={20} className="cursor-pointer hover:text-slate-600 transition-colors" />}
                                                        <XCircle
                                                            size={20}
                                                            className="cursor-pointer hover:text-red-500 transition-colors"
                                                            onClick={() => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    tracks: prev.tracks.map(t => t.id === activeTrackId ? { ...t, audio_url: "" } : t)
                                                                }));
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="h-1.5 bg-slate-200 rounded-full w-full overflow-hidden">
                                                    <div className={`h-full bg-primary rounded-full transition-all duration-500 ${formData.tracks.find(t => t.id === activeTrackId)?.audio_url ? 'w-full' : 'w-0'}`}></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 sm:ml-4 border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-6">
                                                <div className="w-10 h-6 bg-[#FF9B50] rounded-full relative cursor-pointer shadow-inner">
                                                    <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
                                                </div>
                                                <div className="text-xs text-slate-500 font-bold whitespace-nowrap">
                                                    무료 듣기<br /><span className="font-normal text-[10px] text-slate-400">체크 시 샘플 파일로 제공</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Script Area */}
                                    <div className="space-y-4 relative">
                                        <label className="font-bold text-slate-800 text-sm">스크립트*</label>
                                        <div className="border border-slate-200 rounded-2xl bg-white focus-within:border-primary focus-within:shadow-xl focus-within:shadow-primary/5 transition-all overflow-hidden flex flex-col">
                                            <div className="flex items-center gap-4 border-b border-slate-50 bg-slate-50/50 px-4 py-2">
                                                <button className="p-1 hover:text-primary transition-colors text-slate-500"><ImageIcon size={18} /></button>
                                                <div className="w-px h-4 bg-slate-200"></div>
                                                <button className="p-1 hover:text-primary font-bold transition-colors text-slate-500">B</button>
                                                <button className="p-1 hover:text-primary italic transition-colors text-slate-500">I</button>
                                                <button className="p-1 hover:text-primary underline transition-colors text-slate-500">U</button>
                                            </div>
                                            <textarea
                                                key={`track-script-${activeTrackId}`}
                                                placeholder={`<스크립트 작성 팁>\n• 여행자들이 이 장소에 대해 뭘 알면 좋을지, 꼭 알아야 할 중요한 내용\n• 구어체로, 실제로 말하듯이!\n• 너무 많은 정보를 나열하지 말고 간단 명료하게\n• 번역 말투, 어려운 전문적인 단어 X`}
                                                className="w-full h-[400px] p-6 outline-none resize-none text-sm leading-relaxed text-slate-700 bg-transparent flex-1"
                                                value={formData.tracks.find(t => t.id === activeTrackId)?.script || ""}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        tracks: prev.tracks.map(t => t.id === activeTrackId ? { ...t, script: val } : t)
                                                    }));
                                                }}
                                            ></textarea>
                                            <div className="flex items-center justify-between border-t border-slate-50 bg-slate-50/30 px-6 py-3">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">자동 저장됨</span>
                                                <span className="text-[10px] font-bold text-slate-400 tracking-tight">{formData.tracks.find(t => t.id === activeTrackId)?.script?.length || 0} / 2,000자</span>
                                            </div>
                                        </div>
                                        <div className="absolute top-0 right-4 px-3 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-full">
                                            맞춤법 검사 추천
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 5 && (
                    <div className="bg-white rounded-[40px] border border-surface-border shadow-sm p-16 animate-in fade-in zoom-in-95 duration-700 text-center space-y-8">
                        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <CheckCircle2 size={48} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-slate-900">콘텐츠 등록 신청 완료!</h3>
                            <p className="text-slate-500 text-lg leading-relaxed max-w-md mx-auto">
                                축하합니다! 콘텐츠 등록이 성공적으로 완료되었습니다.<br />
                                이제 관리자 페이지에서 등록하신 콘텐츠를 확인하고 관리하실 수 있습니다.
                            </p>
                        </div>
                        <div className="pt-6">
                            <button
                                onClick={onList}
                                className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                            >
                                목록으로 돌아가기
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Footer (Compact Height & Blur) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] z-50">
                <div className="max-w-[1400px] mx-auto px-10 py-3 flex justify-end gap-3">
                    <button
                        onClick={() => {
                            if (currentStep === 5) {
                                setCurrentStep(formData.contentType === 'electronic_book' ? 3 : 4);
                            } else if (currentStep === 4) {
                                setCurrentStep(formData.mapType === 'none' ? 2 : 3);
                            } else if (currentStep === 3) {
                                setCurrentStep(formData.contentType === 'electronic_book' ? 1 : 2);
                            } else {
                                setCurrentStep(prev => Math.max(1, prev - 1));
                            }
                        }}
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
                        {currentStep === 5 ? "최종 저장 및 완료" : "저장 및 다음 단계로"}
                    </button>
                </div>
            </div>
        </div>
    );
}
