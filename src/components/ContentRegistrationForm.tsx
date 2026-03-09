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
    Map,
    Folder,
    FileAudio,
    Trash2,
    Save,
    UploadCloud,
    Settings2,
    GripVertical
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Track {
    id: number | string;
    spot_id: number | string | null;
    title: string;
    description: string;
    audio_url: string;
    script: string;
    image_url: string;
    is_free: boolean;
    order_index: number;
    // Museum-exclusive artwork info
    artwork_title_ko?: string;
    artwork_title_orig?: string;
    artist_name_ko?: string;
    artwork_url?: string;
    room_location?: string;
    sequence_number?: string;
}

interface Chapter {
    id: number | string;
    name: string;
    tracks: Track[];
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
        tracks: [] as Track[], // Keep for flat compatibility if needed, but primary is chapters
        chapters: [
            {
                id: 1,
                name: "기본 챕터",
                tracks: [
                    { id: 1, spot_id: 1, title: "트랙명 1", description: "", audio_url: "", image_url: "", script: "", is_free: false, order_index: 1, artwork_title_ko: "", artwork_title_orig: "", artist_name_ko: "", artwork_url: "", room_location: "", sequence_number: "1" },
                    { id: 2, spot_id: 2, title: "트랙명 2", description: "", audio_url: "", image_url: "", script: "이미 작성된 트랙 2의 예시 스크립트입니다...", is_free: false, order_index: 2, artwork_title_ko: "수련 연작", artwork_title_orig: "Reflets d'arbres", artist_name_ko: "클로드 모네", artwork_url: "https://www.musee-orangerie.fr/fr/oeuvres/reflets-darbres-196309", room_location: "3", sequence_number: "2" },
                    { id: 3, spot_id: 2, title: "트랙명 3", description: "", audio_url: "", image_url: "", script: "", is_free: false, order_index: 3, artwork_title_ko: "", artwork_title_orig: "", artist_name_ko: "", artwork_url: "", room_location: "", sequence_number: "3" }
                ]
            }
        ] as Chapter[]
    });
    const [contentId, setContentId] = useState<string | number | null>(null);
    const [isCityOpen, setIsCityOpen] = useState(false);
    const [activeTrackId, setActiveTrackId] = useState<number | string>(2);
    const [activeChapterId, setActiveChapterId] = useState<number | string>(1);
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [editingName, setEditingName] = useState("");

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

    const addChapter = () => {
        const newChapter: Chapter = {
            id: `chapter-${Date.now()}`,
            name: "새 챕터",
            tracks: []
        };
        setFormData(prev => ({ ...prev, chapters: [...prev.chapters, newChapter] }));
    };

    const deleteChapter = (chapterId: string | number) => {
        if (!window.confirm("챕터를 삭제하시겠습니까? 챕터 내의 모든 트랙도 함께 삭제됩니다.")) return;
        setFormData(prev => ({ ...prev, chapters: prev.chapters.filter(c => c.id !== chapterId) }));
    };

    const addTrack = (chapterId: string | number) => {
        const newTrack: Track = {
            id: `track-${Date.now()}`,
            spot_id: null,
            title: "새 트랙",
            description: "",
            audio_url: "",
            image_url: "",
            script: "",
            is_free: false,
            order_index: 0,
            artwork_title_ko: "",
            artwork_title_orig: "",
            artist_name_ko: "",
            artwork_url: "",
            room_location: "",
            sequence_number: ""
        };
        setFormData(prev => ({
            ...prev,
            chapters: prev.chapters.map(c => c.id === chapterId ? { ...c, tracks: [...c.tracks, newTrack] } : c)
        }));
        setActiveTrackId(newTrack.id);
        setActiveChapterId(chapterId);
    };

    const deleteTrack = (chapterId: string | number, trackId: string | number) => {
        if (!window.confirm("트랙을 삭제하시겠습니까?")) return;
        setFormData(prev => ({
            ...prev,
            chapters: prev.chapters.map(c => c.id === chapterId ? { ...c, tracks: c.tracks.filter(t => t.id !== trackId) } : c)
        }));
        if (activeTrackId === trackId) {
            setActiveTrackId("");
        }
    };

    const updateTrack = (trackId: string | number, updates: Partial<Track>) => {
        setFormData(prev => ({
            ...prev,
            chapters: prev.chapters.map(c => ({
                ...c,
                tracks: c.tracks.map(t => t.id === trackId ? { ...t, ...updates } : t)
            }))
        }));
    };

    const updateChapterName = (chapterId: string | number, name: string) => {
        setFormData(prev => ({
            ...prev,
            chapters: prev.chapters.map(c => c.id === chapterId ? { ...c, name } : c)
        }));
    };

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'gallery' | 'epub' | 'track' | 'track_image') => {
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
                    chapters: prev.chapters.map(chapter => ({
                        ...chapter,
                        tracks: chapter.tracks.map(t => t.id === activeTrackId ? { ...t, audio_url: publicUrl } : t)
                    }))
                }));
            } else if (type === 'track_image') {
                setFormData(prev => ({
                    ...prev,
                    chapters: prev.chapters.map(chapter => ({
                        ...chapter,
                        tracks: chapter.tracks.map(t => t.id === activeTrackId ? { ...t, image_url: publicUrl } : t)
                    }))
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
            const spotIdMap: Record<string | number, string> = {};
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
            const allTracks = formData.chapters.flatMap(c => c.tracks);
            if (allTracks.length > 0) {
                const tracksToInsert = allTracks.map(t => ({
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

            if (onRefresh) {
                await onRefresh();
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
        <div className="w-full min-h-screen bg-slate-100/50 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="w-full px-6 md:px-10 bg-white border-b border-slate-100 flex items-center justify-between py-6">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">콘텐츠 등록 및 수정</h2>
                <button
                    onClick={onBack}
                    className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-normal transition-all text-sm shadow-sm"
                >
                    뒤로가기
                </button>
            </div>

            {/* Stepper Navigation */}
            <div className="w-full px-6 md:px-10 py-10">
                <div className="bg-white p-8 md:p-10 rounded-[32px] border border-surface-border shadow-sm mb-12 overflow-hidden">
                    <div className="relative flex justify-between items-center max-w-5xl mx-auto px-4">
                        <div className="absolute top-[32px] left-0 w-full h-[3px] bg-slate-100 -z-0 rounded-full" />
                        <div
                            className="absolute top-[32px] left-0 h-[3px] bg-primary transition-all duration-700 ease-in-out -z-0 rounded-full"
                            style={{ width: `${steps.length > 1 ? (Math.max(0, steps.findIndex(s => s.id === currentStep)) / (steps.length - 1)) * 100 : 0}%` }}
                        />

                        {steps.map((step, index) => {
                            const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
                            const isActive = currentStep === step.id;

                            return (
                                <div key={step.id} className="flex flex-col items-center group relative cursor-pointer z-10" onClick={() => handleStepChange(step.id)}>
                                    <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center text-2xl font-normal transition-all duration-500 ${isActive ? "bg-primary text-white scale-110 shadow-2xl shadow-primary/40 ring-4 ring-primary/10" : isCompleted ? "bg-slate-900 text-white" : "bg-white text-slate-300 border-2 border-slate-100 group-hover:border-slate-200"}`}>
                                        {isCompleted ? <CheckCircle2 size={32} /> : (index + 1)}
                                    </div>
                                    <span className={`absolute -bottom-12 whitespace-nowrap text-base font-normal tracking-tight transition-all duration-300 ${isActive ? "text-slate-900 scale-110" : "text-slate-400 group-hover:text-slate-600"}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-16 pt-8 border-t border-slate-50 flex items-center gap-3 text-slate-400 text-sm font-normal">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <p>안내에 따라 콘텐츠 내용을 정확하게 설명해 주세요. 승인을 위한 심사가 진행됩니다.</p>
                    </div>
                </div>

                {/* Step Content Outer Wrapper (Handling Full Width for Step 4) */}
                <div className={`${currentStep === 4 ? "w-full" : "max-w-[1400px] mx-auto px-6 md:px-10 mb-20"} space-y-8`}>
                    {currentStep === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            {/* 1. 콘텐츠 유형 Selection Tiles */}
                            <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-12 space-y-10">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-bold text-slate-900">콘텐츠 유형*</h3>
                                    <span className="text-slate-400 text-base font-normal">하나를 선택해 주세요</span>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    {[
                                        { id: 'electronic_book', label: '전자책', desc: 'PDF, ePub 형식의 텍스트 기반 콘텐츠', icon: BookOpen },
                                        { id: 'audio_video', label: '오디오 / 비디오', desc: 'MP3, MP4 형식의 멀티미디어 콘텐츠', icon: PlayCircle }
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => setFormData(prev => ({ ...prev, contentType: type.id }))}
                                            className={`relative flex flex-col items-center text-center p-10 rounded-[32px] border-2 transition-all duration-300 group ${formData.contentType === type.id
                                                ? "border-primary bg-primary/[0.03] shadow-lg shadow-primary/5"
                                                : "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white"
                                                }`}
                                        >
                                            <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center mb-6 transition-all duration-300 ${formData.contentType === type.id ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "bg-white text-slate-400 group-hover:text-slate-600 shadow-sm"}`}>
                                                {type.id === 'electronic_book' ? <BookOpen size={40} /> : <PlayCircle size={40} />}
                                            </div>
                                            <span className={`text-xl font-normal mb-2 transition-colors ${formData.contentType === type.id ? "text-primary" : "text-slate-900"}`}>{type.label}</span>
                                            <span className="text-base text-slate-400 leading-relaxed font-regular">{type.desc}</span>
                                            {formData.contentType === type.id && (
                                                <div className="absolute top-6 right-6 text-primary animate-in zoom-in-50 duration-300">
                                                    <CheckCircle2 size={28} fill="currentColor" stroke="white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 2. 카테고리 Selection Tiles */}
                            <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-12 space-y-10">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-bold text-slate-900">카테고리*</h3>
                                    <span className="text-slate-400 text-base font-normal">콘텐츠의 성격을 가장 잘 나타내는 항목을 선택해 주세요</span>
                                </div>
                                <div className="grid grid-cols-3 gap-6">
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
                                            className={`flex flex-col p-8 rounded-[24px] border-2 text-left transition-all duration-300 relative ${formData.category === cat.id
                                                ? "border-primary bg-primary/[0.03] shadow-md shadow-primary/5"
                                                : "border-slate-50 bg-slate-50/30 hover:border-slate-100 hover:bg-white"
                                                }`}
                                        >
                                            <span className={`text-lg font-normal mb-1 ${formData.category === cat.id ? "text-primary" : "text-slate-800"}`}>{cat.label}</span>
                                            <span className="text-sm text-slate-400 line-clamp-1 font-regular">{cat.desc}</span>
                                            {formData.category === cat.id && (
                                                <div className="absolute top-6 right-6 text-primary scale-100">
                                                    <CheckCircle2 size={24} fill="currentColor" stroke="white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 3. 도시 입력 (Improved Searchable Input) */}
                            <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-12 space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-bold text-slate-900">도시*</h3>
                                    <div className="flex gap-6">
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
                                            className="flex items-center gap-3 cursor-pointer group"
                                        >
                                            <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all ${formData.cityType === 'global' ? "bg-slate-900 border-slate-900" : "border-slate-200"}`}>
                                                {formData.cityType === 'global' && <CheckCircle2 size={14} className="text-white" />}
                                            </div>
                                            <span className={`text-base font-normal transition-colors ${formData.cityType === 'global' ? "text-slate-900" : "text-slate-500 group-hover:text-slate-800"}`}>
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
                                            className="flex-1 bg-transparent outline-none text-base font-normal text-slate-800 placeholder:text-slate-300 disabled:cursor-not-allowed"
                                        />
                                        {formData.cityType === 'normal' && <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isCityOpen ? 'rotate-180' : ''}`} />}
                                    </div>

                                    {/* Mock Search Results dropdown - Higher Z-index */}
                                    {isCityOpen && formData.city.length > 0 && formData.cityType === 'normal' && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-surface-border shadow-2xl p-3 z-[100] animate-in slide-in-from-top-2 duration-200">
                                            <div className="p-2 text-[10px] font-normal text-slate-400 uppercase tracking-widest px-4">추천 도시</div>
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
                                                    <span className="text-base font-normal text-slate-800">{c}</span>
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
                                                    <span className="text-base font-normal text-slate-800">&quot;{formData.city}&quot; 직접 입력</span>
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
                                        <h3 className="text-2xl font-bold text-slate-900">시설 정보*</h3>
                                        <p className="text-slate-400 text-base font-normal">박물관 또는 미술관의 정보를 입력해 주세요.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-sm font-normal text-slate-500 ml-1">기관명 (검색/입력)</label>
                                            <div className="relative group">
                                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                                    <Search size={18} />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="기관 이름을 입력하세요"
                                                    value={formData.museumName}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, museumName: e.target.value }))}
                                                    className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 outline-none transition-all placeholder:text-slate-300 font-normal"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-sm font-normal text-slate-500 ml-1">공식 홈페이지 링크 (선택)</label>
                                            <div className="relative group">
                                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                                    <Layers size={18} className="rotate-45" />
                                                </div>
                                                <input
                                                    type="url"
                                                    placeholder="https://..."
                                                    value={formData.museumLink}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, museumLink: e.target.value }))}
                                                    className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 outline-none transition-all placeholder:text-slate-300 font-normal"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2. 지도 활용 (Map Selection Tiles) */}
                            <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-12 space-y-10">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-bold text-slate-900">지도 활용*</h3>
                                        <p className="text-slate-400 text-base font-normal">여행자가 길을 찾으려면 어떤 지도가 필요한가요?</p>
                                    </div>
                                    <button
                                        onClick={() => window.open('https://www.tourlive.co.kr', '_blank')}
                                        className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-normal text-base hover:bg-slate-50 transition-colors"
                                    >
                                        예시 보기
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {[
                                        { id: 'google_map', label: '외부 구글맵', desc: '팔라티노 언덕 투어, 폼페이 투어 등 명소 가이드', icon: Globe },
                                        { id: 'image_map', label: '내부 이미지 지도', desc: '대영 박물관, 우피치 미술관 등 실내 가이드', icon: ImageIcon },
                                        { id: 'both', label: '외부, 내부 모두 사용', desc: '베르사유 투어, 가우디 반일투어 등 복합 가이드', icon: Layers },
                                        { id: 'none', label: '필요하지 않음', desc: '여행이야기, 가이드북, 인문학 콘텐츠 등', icon: XCircle }
                                    ].map((map) => (
                                        <button
                                            key={map.id}
                                            onClick={() => setFormData(prev => ({ ...prev, mapType: map.id }))}
                                            className={`flex gap-6 p-8 rounded-[32px] border-2 text-left transition-all duration-300 relative items-center ${formData.mapType === map.id
                                                ? "border-primary bg-primary/[0.03] shadow-lg shadow-primary/5"
                                                : "border-slate-100 bg-slate-50/30 hover:border-slate-200 hover:bg-white"
                                                }`}
                                        >
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 ${formData.mapType === map.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-slate-400 border border-slate-100 shadow-sm"}`}>
                                                <map.icon size={28} />
                                            </div>
                                            <div className="flex-1 pr-8">
                                                <span className={`block text-xl font-normal mb-1 ${formData.mapType === map.id ? "text-primary" : "text-slate-800"}`}>{map.label}</span>
                                                <span className="text-base text-slate-400 leading-snug font-regular">{map.desc}</span>
                                            </div>
                                            {formData.mapType === map.id && (
                                                <div className="absolute top-6 right-6 text-primary animate-in zoom-in-50 duration-300">
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
                                    <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-12 space-y-8">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-2xl font-bold text-slate-900">콘텐츠 이름*</h3>
                                            <span className={`text-base font-normal ${formData.title.length > 50 ? 'text-red-500' : 'text-slate-400'}`}>
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
                                                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 outline-none transition-all font-normal text-lg"
                                            />
                                            <div className="text-xs text-slate-400 space-y-1 ml-1 leading-relaxed">
                                                <p>• 50자 제한 / 이모티콘 및 특수문자 사용 불가</p>
                                                <p>• 등록하시고자 하는 콘텐츠의 특성과 지역이 잘 드러나는 키워드를 사용해 주세요.</p>
                                                <p>• 기존 콘텐츠 이름과 중복될 시 콘텐츠 등록이 반려됩니다.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. 콘텐츠 소개글 */}
                                    <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-12 space-y-8">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-2xl font-bold text-slate-900">콘텐츠 소개글*</h3>
                                            <span className={`text-base font-normal ${formData.description.length < 500 || formData.description.length > 1000 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                {formData.description.length} / 1000자 (최소 500자)
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            <textarea
                                                placeholder={`<소개글 작성 추천 요소>\n• 이 투어가 왜 특별한지\n• 이 장소를 왜 추천하는지, 그리고 그냥 방문하면 무엇을 놓치게 되는지\n• 이 투어를 통해 여행자가 무엇을 알고 무엇을 느끼게 될지\n• 이 투어가 어떤 방식으로 진행되는지, 어떤 포인트를 다루는지\n• 어떤 여행자에게 특히 잘 맞는지\n\n[예시]\n우피치 미술관은 르네상스가 태어난 도시 피렌체를 대표하는 세계 최고의 미술관입니다.\n하지만 수많은 명화 속에 담긴 의미와 이야기를 모르고 보면, 그냥 '유명한 그림들'로만 지나치기 쉽습니다.\n이 투어는 르네상스 시대 사람들의 생각이 어떻게 바뀌었는지, 화가들이 그것을 어떻게 그림 속에 담아냈는지를 작품과 함께 쉽고 재미있게 풀어드립니다.`}
                                                value={formData.description}
                                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                className="w-full px-6 py-6 rounded-2xl border-2 border-slate-200 bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 outline-none transition-all font-normal text-base min-h-[400px] leading-relaxed resize-none"
                                            />
                                            <p className="text-xs text-slate-400 ml-1">• 최소 500자 최대 1000자 제한 (공백포함)</p>
                                        </div>
                                    </div>

                                    {/* 3. 콘텐츠 가격 */}
                                    <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-12 space-y-8">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-2xl font-bold text-slate-900">콘텐츠 가격*</h3>
                                            <button className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-500 font-normal text-base hover:bg-slate-50 transition-colors">가이드라인</button>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="relative flex-1 max-w-xs group">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-900 font-normal">₩</div>
                                                <input
                                                    type="text"
                                                    placeholder="가격 입력"
                                                    value={formData.price}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                                        setFormData(prev => ({ ...prev, price: val ? Number(val).toLocaleString() : '' }));
                                                    }}
                                                    className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-slate-200 bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 outline-none transition-all font-normal text-lg text-right"
                                                />
                                            </div>
                                            <span className="text-slate-400 font-normal">KRW (₩) 기준</span>
                                        </div>
                                    </div>

                                    {/* 4. 이미지 업로드 */}
                                    <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-12 space-y-10">
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-normal text-slate-900">이미지 업로드*</h3>
                                            <div className="text-sm text-slate-400 space-y-1 leading-relaxed font-regular">
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
                                                        <img src={formData.thumbnailPreview} className="w-full h-full object-cover" alt="Thumbnail Preview" />
                                                    ) : <ImageIcon size={32} />}
                                                </div>
                                                <div className="flex-1">
                                                    <span className="block text-base font-normal text-slate-900 mb-1">대표사진*</span>
                                                    <div className="flex items-center gap-3">
                                                        <label className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-normal text-sm rounded-xl transition-all cursor-pointer">
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
                                                        <img src={formData.galleryPreviews[0]} className="w-full h-full object-cover" alt="Gallery Preview 1" />
                                                    ) : <ImageIcon size={32} />}
                                                </div>
                                                <div className="flex-1">
                                                    <span className="block text-base font-normal text-slate-900 mb-1">이미지1</span>
                                                    <div className="flex items-center gap-3">
                                                        <label className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 font-normal text-sm rounded-xl transition-all cursor-pointer">
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
                                                        <img src={formData.galleryPreviews[1]} className="w-full h-full object-cover" alt="Gallery Preview 2" />
                                                    ) : <ImageIcon size={32} />}
                                                </div>
                                                <div className="flex-1">
                                                    <span className="block text-base font-normal text-slate-900 mb-1">이미지2</span>
                                                    <div className="flex items-center gap-3">
                                                        <label className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 font-normal text-sm rounded-xl transition-all cursor-pointer">
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
                                    <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-12 space-y-8">
                                        <h3 className="text-2xl font-normal text-slate-900">
                                            {formData.contentType === 'electronic_book' ? 'epub 파일 업로드*' : '콘텐츠 파일 업로드*'}
                                        </h3>
                                        <div className="flex items-center gap-4">
                                            <label className="px-10 py-6 bg-primary/10 hover:bg-primary/20 text-primary font-normal text-lg rounded-2xl transition-all flex items-center gap-3 border-2 border-dashed border-primary/30 cursor-pointer">
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
                                        <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-12 space-y-10">
                                            <div className="space-y-2 mb-8">
                                                <h3 className="text-2xl font-bold text-slate-900">
                                                    외부 구글맵 설정 {formData.mapType === 'both' ? '(스팟 지정)' : ''}
                                                </h3>
                                                <p className="text-slate-400 text-base font-normal">콘텐츠가 재생될 외부 위치를 지도에 핀으로 표시해 주세요.</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-[500px]">
                                                {/* Left: Points List */}
                                                <div className="col-span-1 md:col-span-4 border-r border-slate-100 pr-6 space-y-4 overflow-y-auto custom-scrollbar">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-normal text-slate-900">외부 스팟 목록</span>
                                                        <button className="text-sm font-normal text-primary flex items-center gap-1 bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-lg">
                                                            <Plus size={16} /> 스팟 추가
                                                        </button>
                                                    </div>
                                                    {/* Mock Google Points */}
                                                    {formData.spots.filter(s => s.mapType === 'google_map').map((spot, idx) => (
                                                        <div key={spot.id} className="p-4 rounded-xl border-2 border-primary bg-primary/[0.03] space-y-3 shadow-sm shadow-primary/5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-normal text-primary text-sm flex items-center gap-2">
                                                                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">{idx + 1}</div>
                                                                    스팟 {idx + 1}
                                                                </span>
                                                                <button className="text-slate-400 hover:text-red-500 transition-colors"><XCircle size={16} /></button>
                                                            </div>
                                                            <input type="text" placeholder="스팟 이름" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary font-normal" defaultValue={spot.name} />
                                                        </div>
                                                    ))}
                                                    {/* Empty State Mock */}
                                                    {formData.spots.filter(s => s.mapType === 'google_map').length === 0 && (
                                                        <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                                                            <p className="text-sm text-slate-400 font-normal">우측 지도에서 위치를 클릭해<br />새 스팟을 추가하세요.</p>
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
                                                            <p className="font-normal text-slate-700 text-lg">Google Map View (API Placeholder)</p>
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
                                        <div className="bg-white rounded-[32px] border border-surface-border shadow-sm p-12 space-y-10">
                                            <div className="space-y-2 mb-8">
                                                <h3 className="text-2xl font-bold text-slate-900">
                                                    내부 이미지 지도 설정 {formData.mapType === 'both' ? '(스팟 지정)' : ''}
                                                </h3>
                                                <p className="text-slate-400 text-base font-normal">플로어플랜 등 내부 지도 이미지를 업로드하고 스팟을 표시해 주세요.</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-[500px]">
                                                {/* Left: Points List */}
                                                <div className="col-span-1 md:col-span-4 border-r border-slate-100 pr-6 space-y-4 overflow-y-auto custom-scrollbar">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-normal text-slate-900">내부 스팟 목록</span>
                                                        <button className="text-sm font-normal text-[#FF9B50] flex items-center gap-1 bg-orange-50 hover:bg-orange-100 transition-colors px-3 py-1.5 rounded-lg">
                                                            <Plus size={16} /> 스팟 추가
                                                        </button>
                                                    </div>
                                                    {/* Mock Image Points */}
                                                    {formData.spots.filter(s => s.mapType === 'image_map').map((spot, idx) => (
                                                        <div key={spot.id} className="p-4 rounded-xl border-2 border-[#FFD1A6] bg-[#FFD1A6]/10 space-y-3 shadow-sm shadow-orange-500/5 cursor-pointer">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-normal text-[#D97706] text-sm flex items-center gap-2">
                                                                    <div className="w-5 h-5 rounded-full bg-[#FF9B50] text-white flex items-center justify-center text-[10px]">{idx + 1}</div>
                                                                    스팟 {idx + 1}
                                                                </span>
                                                                <button className="text-slate-400 hover:text-red-500 transition-colors"><XCircle size={16} /></button>
                                                            </div>
                                                            <input type="text" placeholder="스팟 이름" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#FF9B50] font-normal" defaultValue={spot.name} />
                                                        </div>
                                                    ))}
                                                    {/* Add new mock spot visually */}
                                                    <div className="p-4 rounded-xl border-2 border-slate-100 bg-slate-50 space-y-3 hover:border-slate-200 transition-colors cursor-pointer">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-normal text-slate-700 text-sm flex items-center gap-2">
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
                                                            <p className="font-normal text-slate-700 text-lg">내부 지도 이미지 업로드</p>
                                                            <p className="text-sm text-slate-400">지도 이미지를 업로드 후 화면을 클릭해 내부 스팟을 지정하세요.</p>
                                                        </div>
                                                        <button className="px-6 py-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md text-sm font-normal text-slate-700 transition-all active:scale-95">이미지 선택</button>
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
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 relative flex border-t border-slate-200 bg-white">
                            {/* Left: Hierarchical Sidebar */}
                            <div className="w-[420px] shrink-0 sticky top-16 h-[calc(100vh-140px)] flex flex-col border-r border-slate-200">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                                    <div className="space-y-0.5">
                                        <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                            <Layers size={20} className="text-primary" /> 투어 트랙 관리
                                        </h3>
                                        <p className="text-base text-slate-400 font-normal uppercase tracking-wider">챕터와 트랙을 구성하세요</p>
                                    </div>
                                    <button
                                        onClick={addChapter}
                                        className="p-2 bg-white border border-slate-100 text-primary rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95 group"
                                        title="챕터 추가"
                                    >
                                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/10">
                                    {formData.chapters.map((chapter) => (
                                        <div key={chapter.id} className="space-y-2">
                                            {/* Chapter Header */}
                                            <div className="group flex items-center justify-between bg-white text-slate-900 p-2 px-3 rounded-lg shadow-sm relative overflow-hidden border border-slate-100">
                                                <div className="flex items-center gap-2 z-10 flex-1 min-w-0">
                                                    <Folder size={14} className="text-slate-400" />
                                                    {editingId === chapter.id ? (
                                                        <input
                                                            autoFocus
                                                            className="bg-transparent border-b border-slate-400 outline-none w-full font-normal text-xs"
                                                            value={editingName}
                                                            onChange={(e) => setEditingName(e.target.value)}
                                                            onBlur={() => {
                                                                updateChapterName(chapter.id, editingName);
                                                                setEditingId(null);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    updateChapterName(chapter.id, editingName);
                                                                    setEditingId(null);
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <span
                                                            className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors truncate"
                                                            onDoubleClick={() => {
                                                                setEditingId(chapter.id);
                                                                setEditingName(chapter.name);
                                                            }}
                                                        >
                                                            {chapter.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-0.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => addTrack(chapter.id)}
                                                        className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-primary transition-colors"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteChapter(chapter.id)}
                                                        className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Tracks List */}
                                            <div className="ml-2 pl-3 border-l border-slate-200 space-y-1">
                                                {chapter.tracks.map((track) => (
                                                    <div
                                                        key={track.id}
                                                        onClick={() => {
                                                            setActiveTrackId(track.id);
                                                            setActiveChapterId(chapter.id);
                                                        }}
                                                        className={`group py-1.5 px-3 border rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-all ${activeTrackId === track.id ? 'border-primary bg-primary/[0.04] shadow-sm ring-1 ring-primary/20' : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-white'}`}
                                                    >
                                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                            <div className={`shrink-0 w-6 h-6 rounded flex items-center justify-center transition-all ${activeTrackId === track.id ? 'bg-primary text-white' : track.audio_url ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-300'}`}>
                                                                <div className="w-1 h-1 rounded-full bg-current opacity-60" />
                                                            </div>
                                                            <span className={`text-base font-semibold truncate leading-none ${activeTrackId === track.id ? 'text-primary' : 'text-slate-900'}`}>
                                                                {track.title}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            {track.audio_url && (
                                                                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteTrack(chapter.id, track.id);
                                                                }}
                                                                className="p-0.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 rounded transition-all"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {chapter.tracks.length === 0 && (
                                                    <button
                                                        onClick={() => addTrack(chapter.id)}
                                                        className="w-full py-2 rounded-lg border border-dashed border-slate-200 text-slate-300 text-[10px] font-normal hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2 bg-slate-50/20"
                                                    >
                                                        <Plus size={12} /> 트랙 추가
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={addChapter}
                                        className="w-full py-2.5 rounded-lg border border-dashed border-slate-200 text-slate-400 font-semibold text-lg hover:border-primary hover:bg-primary/[0.01] hover:text-primary transition-all flex items-center justify-center gap-2 group mt-4"
                                    >
                                        <Plus size={14} className="group-hover:rotate-90 transition-transform" /> 챕터 추가하기
                                    </button>
                                </div>

                                <div className="p-6 border-t border-slate-100 bg-white">
                                    <div className="flex items-center justify-between mb-2 text-[10px] font-normal">
                                        <span className="text-slate-400">전체 진행률</span>
                                        <span className="text-primary">
                                            {Math.round((formData.chapters.flatMap(c => c.tracks).filter(t => t.audio_url).length / Math.max(1, formData.chapters.flatMap(c => c.tracks).length)) * 100)}%
                                        </span>
                                    </div>
                                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000 ease-out"
                                            style={{ width: `${(formData.chapters.flatMap(c => c.tracks).filter(t => t.audio_url).length / Math.max(1, formData.chapters.flatMap(c => c.tracks).length)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Track Content Form (Scrollable) */}
                            <div className="flex-1 min-h-[calc(100vh-140px)] flex flex-col bg-white">
                                {activeTrackId ? (
                                    <>
                                        {/* Form Header */}
                                        <div className="px-12 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/10">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                                    <Edit2 size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-slate-400 uppercase tracking-widest">트랙 상세 정보</h3>
                                                    <p className="text-slate-900 text-base font-normal mt-1">현재 트랙: <span className="text-primary italic">{formData.chapters.find(c => c.id === activeChapterId)?.tracks.find(t => t.id === activeTrackId)?.title}</span></p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-normal border border-emerald-100">
                                                <Save size={14} /> 자동 저장됨
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-12 space-y-16 custom-scrollbar pb-32">
                                            {/* Basic Info Section */}
                                            <div className="space-y-8">
                                                <div className="flex items-center gap-4 mb-8">
                                                    <Settings2 size={28} className="text-[#000000]" />
                                                    <h4 className="text-lg font-bold text-[#000000] tracking-tight">기본 설정</h4>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                    <div className="space-y-4">
                                                        <label className="text-lg font-bold text-[#000000] ml-1">트랙 제목*</label>
                                                        <input
                                                            type="text"
                                                            placeholder="예: 루브르 박물관 소개"
                                                            value={formData.chapters.find(c => c.id === activeChapterId)?.tracks.find(t => t.id === activeTrackId)?.title || ""}
                                                            onChange={(e) => updateTrack(activeTrackId, { title: e.target.value })}
                                                            className="bg-white border-slate-200 focus:bg-white focus:border-primary shadow-sm hover:border-slate-300 transition-all font-normal text-lg outline-none px-6 py-4 rounded-xl"
                                                        />
                                                    </div>
                                                    {formData.mapType !== 'none' && (
                                                        <div className="space-y-4">
                                                            <label className="text-lg font-bold text-[#000000] ml-1">연결된 스팟*</label>
                                                            <div className="relative">
                                                                <select
                                                                    value={formData.chapters.find(c => c.id === activeChapterId)?.tracks.find(t => t.id === activeTrackId)?.spot_id || ""}
                                                                    onChange={(e) => updateTrack(activeTrackId, { spot_id: e.target.value === 'none' ? 'none' : Number(e.target.value) })}
                                                                    className="appearance-none w-full px-6 py-4 rounded-xl border-2 border-slate-200 bg-white hover:border-slate-300 focus:bg-white focus:border-primary focus:shadow-xl focus:shadow-primary/5 outline-none transition-all font-normal text-slate-700 cursor-pointer text-lg"
                                                                >
                                                                    <option value="">스팟을 선택하세요</option>
                                                                    {formData.spots.map(spot => (
                                                                        <option key={spot.id} value={spot.id}>{spot.name}</option>
                                                                    ))}
                                                                    <option value="none">스팟 연결 없음</option>
                                                                </select>
                                                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Audio Upload Zone */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4 mb-8">
                                                    <FileAudio size={28} className="text-[#000000]" />
                                                    <h4 className="text-lg font-bold text-[#000000] tracking-tight">오디오 파일</h4>
                                                </div>
                                                <div className="space-y-8">
                                                    <div className={`relative h-56 rounded-[32px] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-6 ${formData.chapters.find(c => c.id === activeChapterId)?.tracks.find(t => t.id === activeTrackId)?.audio_url ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 hover:border-primary bg-slate-50/30'}`}>
                                                        <input
                                                            type="file"
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                            accept="audio/*"
                                                            onChange={(e) => handleFileUpload(e, 'track')}
                                                        />
                                                        {formData.chapters.find(c => c.id === activeChapterId)?.tracks.find(t => t.id === activeTrackId)?.audio_url ? (
                                                            <>
                                                                <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                                                    <CheckCircle2 size={32} />
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className="font-normal text-slate-900 text-lg">파일 업로드 완료</p>
                                                                    <p className="text-xs text-slate-400 mt-1.5 font-normal">클릭하여 파일을 교체할 수 있습니다</p>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="w-16 h-16 bg-white text-slate-300 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                                                    <UploadCloud size={32} />
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className="font-normal text-slate-900 text-lg">오디오 클릭 또는 드래그</p>
                                                                    <p className="text-xs text-slate-400 mt-1.5 font-normal">MP3, WAV 파일 지원 (최대 50MB)</p>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Free Toggle */}
                                                    <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-sm">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-white text-amber-500 rounded-xl flex items-center justify-center border border-amber-100 shadow-sm">
                                                                <PlayCircle size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="font-normal text-slate-900 text-base">무료 미리듣기 제공</p>
                                                                <p className="text-xs text-slate-400 font-normal">사용자가 전체 가이드 중 샘플로 듣게 됩니다</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => updateTrack(activeTrackId, { is_free: !formData.chapters.find(c => c.id === activeChapterId)?.tracks.find(t => t.id === activeTrackId)?.is_free })}
                                                            className={`w-14 h-8 rounded-full transition-all relative ${formData.chapters.find(c => c.id === activeChapterId)?.tracks.find(t => t.id === activeTrackId)?.is_free ? 'bg-primary' : 'bg-slate-200'}`}
                                                        >
                                                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${formData.chapters.find(c => c.id === activeChapterId)?.tracks.find(t => t.id === activeTrackId)?.is_free ? 'left-7' : 'left-1'}`}></div>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Script Section */}
                                            <div className="space-y-8">
                                                <div className="flex items-center gap-4 mb-8">
                                                    <FileText size={28} className="text-[#000000]" />
                                                    <h4 className="text-lg font-bold text-[#000000] tracking-tight">스크립트</h4>
                                                </div>
                                                <div className="bg-white rounded-3xl border-2 border-slate-100 overflow-hidden focus-within:border-primary focus-within:shadow-2xl focus-within:shadow-primary/5 transition-all flex flex-col">
                                                    <div className="flex items-center gap-4 border-b border-slate-50 bg-slate-50/30 px-6 py-4">
                                                        <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-primary transition-all"><ImageIcon size={20} /></button>
                                                        <div className="w-px h-6 bg-slate-200"></div>
                                                        <button className="w-9 h-9 font-normal text-lg hover:bg-white rounded-lg text-slate-400 hover:text-primary transition-all">B</button>
                                                        <button className="w-9 h-9 italic text-lg hover:bg-white rounded-lg text-slate-400 hover:text-primary transition-all">I</button>
                                                        <button className="w-9 h-9 underline text-lg hover:bg-white rounded-lg text-slate-400 hover:text-primary transition-all">U</button>
                                                    </div>
                                                    <textarea
                                                        placeholder={`실제로 말하듯이 편안한 말투로 스크립트를 작성해 주세요.\n\n예시:\n"여러분, 반갑습니다. 지금 제 앞에 보이는 이 그림이 바로 그 유명한 모나리자입니다. 자세히 한번 보실까요?"`}
                                                        className="w-full h-[500px] p-8 outline-none resize-none text-lg leading-relaxed text-slate-700 font-normal placeholder:text-slate-300"
                                                        value={formData.chapters.find(c => c.id === activeChapterId)?.tracks.find(t => t.id === activeTrackId)?.script || ""}
                                                        onChange={(e) => updateTrack(activeTrackId, { script: e.target.value })}
                                                    />
                                                    <div className="px-8 py-4 border-t border-slate-50 bg-slate-50/20 flex items-center justify-between">
                                                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">Editor Mode</span>
                                                        <span className="text-sm font-normal text-slate-400">
                                                            {formData.chapters.find(c => c.id === activeChapterId)?.tracks.find(t => t.id === activeTrackId)?.script?.length || 0} / 2,000자
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Track Image Section */}
                                            <div className="space-y-8">
                                                <div className="flex items-center gap-4 mb-8">
                                                    <ImageIcon size={28} className="text-[#000000]" />
                                                    <h4 className="text-lg font-bold text-[#000000] tracking-tight">트랙 대표 이미지</h4>
                                                </div>
                                                <div className={`relative h-64 rounded-[32px] border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center gap-6 ${formData.chapters.find(c => c.id === activeChapterId)?.tracks.find(t => t.id === activeTrackId)?.image_url ? 'border-primary bg-white shadow-xl shadow-primary/5' : 'border-slate-100 hover:border-primary bg-slate-50/30'}`}>
                                                    <input
                                                        type="file"
                                                        className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileUpload(e, 'track_image')}
                                                    />
                                                    {formData.chapters.find(c => c.id === activeChapterId)?.tracks.find(t => t.id === activeTrackId)?.image_url ? (
                                                        <>
                                                            <img
                                                                src={formData.chapters.find(c => c.id === activeChapterId)?.tracks.find(t => t.id === activeTrackId)?.image_url}
                                                                alt="Track Representative"
                                                                className="absolute inset-0 w-full h-full object-cover opacity-90"
                                                            />
                                                            <div className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center text-white z-10 transition-opacity hover:opacity-100 opacity-0">
                                                                <UploadCloud size={40} />
                                                                <p className="font-normal text-base mt-2">이미지 교체</p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-16 h-16 bg-white text-slate-300 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                                                <Plus size={32} />
                                                            </div>
                                                            <div className="text-center px-6">
                                                                <p className="font-normal text-slate-900 text-lg">대표 이미지 업로드</p>
                                                                <p className="text-xs text-slate-400 mt-1.5 font-normal leading-relaxed">트랙의 분위기를 가장 잘 보여주는 사진을 등록하세요</p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Artwork Information Section - Conditional */}
                                            {formData.contentType === 'audio_video' && formData.category === 'museum' && (
                                                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 pt-8 border-t border-slate-100">
                                                    <div className="flex items-start gap-4 mb-4">
                                                        <div className="relative">
                                                            <h4 className="text-[22px] font-bold text-[#000000] tracking-tight">작품 정보</h4>
                                                            <div className="absolute -top-1 -right-6 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">7</div>
                                                        </div>
                                                        <p className="text-slate-400 text-sm font-normal mt-1.5 ml-4">미술관 / 박물관 가이드 제작 시 작성해주세요.</p>
                                                    </div>

                                                    <div className="space-y-10">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                            <div className="space-y-4">
                                                                <label className="text-lg font-bold text-[#000000] ml-1">작품명 (한글명)*</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="ex) 수련 연작"
                                                                    value={formData.chapters.find(c => c.id === activeChapterId)?.tracks.find(t => t.id === activeTrackId)?.artwork_title_ko || ""}
                                                                    onChange={(e) => updateTrack(activeTrackId, { artwork_title_ko: e.target.value })}
                                                                    className="w-full px-6 py-4 rounded-xl border-2 border-slate-200 bg-white focus:border-primary shadow-sm hover:border-slate-300 transition-all font-normal text-lg outline-none"
                                                                />
                                                            </div>
                                                            <div className="space-y-4">
                                                                <label className="text-lg font-bold text-[#000000] ml-1">작품명 (원어)*</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="ex) Reflets d'arbres"
                                                                    value={formData.chapters.find(c => c.id === activeChapterId)?.tracks.find(t => t.id === activeTrackId)?.artwork_title_orig || ""}
                                                                    onChange={(e) => updateTrack(activeTrackId, { artwork_title_orig: e.target.value })}
                                                                    className="w-full px-6 py-4 rounded-xl border-2 border-slate-200 bg-white focus:border-primary shadow-sm hover:border-slate-300 transition-all font-normal text-lg outline-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                            <div className="space-y-4">
                                                                <label className="text-lg font-bold text-[#000000] ml-1">작가명 (한글명)*</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="ex) 클로드 모네"
                                                                    value={formData.chapters.find(c => c.id === activeChapterId)?.tracks.find(t => t.id === activeTrackId)?.artist_name_ko || ""}
                                                                    onChange={(e) => updateTrack(activeTrackId, { artist_name_ko: e.target.value })}
                                                                    className="w-full px-6 py-4 rounded-xl border-2 border-slate-200 bg-white focus:border-primary shadow-sm hover:border-slate-300 transition-all font-normal text-lg outline-none"
                                                                />
                                                            </div>
                                                            <div className="space-y-4">
                                                                <label className="text-lg font-bold text-[#000000] ml-1">공식 홈페이지 작품 정보 URL*</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="https://www.musee-orangerie.fr/fr/oeuvres/reflets-darbres-196309"
                                                                    value={formData.chapters.find(c => c.id === activeChapterId)?.tracks.find(t => t.id === activeTrackId)?.artwork_url || ""}
                                                                    onChange={(e) => updateTrack(activeTrackId, { artwork_url: e.target.value })}
                                                                    className="w-full px-6 py-4 rounded-xl border-2 border-slate-300 bg-white focus:border-primary shadow-sm hover:border-slate-300 transition-all font-normal text-lg outline-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                            <div className="space-y-4">
                                                                <label className="text-lg font-bold text-[#000000] ml-1">전시 방 위치*</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="ex) 3"
                                                                    value={formData.chapters.find(c => c.id === activeChapterId)?.tracks.find(t => t.id === activeTrackId)?.room_location || ""}
                                                                    onChange={(e) => updateTrack(activeTrackId, { room_location: e.target.value })}
                                                                    className="w-full px-6 py-4 rounded-xl border-2 border-slate-200 bg-white focus:border-primary shadow-sm hover:border-slate-300 transition-all font-normal text-lg outline-none"
                                                                />
                                                            </div>
                                                            <div className="space-y-4">
                                                                <label className="text-lg font-bold text-[#000000] ml-1">경로 순번*</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="1"
                                                                    value={formData.chapters.find(c => c.id === activeChapterId)?.tracks.find(t => t.id === activeTrackId)?.sequence_number || ""}
                                                                    onChange={(e) => updateTrack(activeTrackId, { sequence_number: e.target.value })}
                                                                    className="w-full px-6 py-4 rounded-xl border-2 border-slate-200 bg-white focus:border-primary shadow-sm hover:border-slate-300 transition-all font-normal text-lg outline-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="pt-6 border-t border-slate-100 space-y-3">
                                                            <p className="text-sm text-slate-500 font-normal flex items-start gap-2">
                                                                <span className="block mt-1.5 w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                                                                작품 정보는 미술관 / 박물관 <span className="font-bold text-slate-700">공식 홈페이지</span>에서 참고하시기 바랍니다.
                                                            </p>
                                                            <p className="text-sm text-slate-500 font-normal flex items-start gap-2">
                                                                <span className="block mt-1.5 w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                                                                작품 위치 변경에 따른 <span className="text-orange-500 font-bold">자동 반영</span>과 <span className="text-orange-500 font-bold">지도 기능</span> 제공을 위해 정확한 정보를 적어주세요.
                                                            </p>
                                                            <p className="text-sm text-slate-500 font-normal flex items-start gap-2">
                                                                <span className="block mt-1.5 w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                                                                <span className="font-bold text-slate-700">경로 순번</span>은 챕터 안에서의 <span className="font-bold text-slate-700">트랙 순서</span>를 말합니다. 여행자가 어느 작품부터 감상하길 원하시나요?
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-8 bg-slate-50/20">
                                        <div className="w-24 h-24 bg-white text-slate-100 rounded-[32px] flex items-center justify-center shadow-xl border border-slate-50">
                                            <FileAudio size={48} />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-normal text-slate-900">편집할 트랙을 선택하세요</h3>
                                            <p className="text-slate-400 max-w-xs mx-auto text-sm font-normal leading-relaxed">
                                                왼쪽 트랙 매니저에서 작업할 트랙을 선택하거나<br />새로운 항목을 추가해 보세요.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => addTrack(formData.chapters[0]?.id || 1)}
                                            className="px-6 py-3 bg-slate-900 text-white font-normal rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center gap-2 text-sm"
                                        >
                                            <Plus size={16} /> 첫 트랙 추가하기
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {currentStep === 5 && (
                        <div className="bg-white rounded-[40px] border border-surface-border shadow-sm p-16 animate-in fade-in zoom-in-95 duration-700 text-center space-y-8">
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <CheckCircle2 size={48} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-normal text-slate-900">콘텐츠 등록 신청 완료!</h3>
                                <p className="text-slate-500 text-lg leading-relaxed max-w-md mx-auto">
                                    축하합니다! 콘텐츠 등록이 성공적으로 완료되었습니다.<br />
                                    이제 관리자 페이지에서 등록하신 콘텐츠를 확인하고 관리하실 수 있습니다.
                                </p>
                            </div>
                            <div className="pt-6">
                                <button
                                    onClick={onList}
                                    className="px-10 py-4 bg-slate-900 text-white font-normal rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                                >
                                    목록으로 돌아가기
                                </button>
                            </div>
                        </div>
                    )}
                </div>
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
                        className="px-6 py-3 rounded-xl font-normal text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-20 disabled:hover:bg-transparent text-sm"
                    >
                        이전 단계로
                    </button>
                    <button
                        onClick={() => handleSaveAndNext()}
                        className="px-10 py-3 bg-slate-900 hover:bg-slate-800 text-white font-normal rounded-xl shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] flex items-center gap-2 text-sm"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : null}
                        {currentStep === 5 ? "최종 저장 및 완료" : "저장 및 다음 단계로"}
                    </button>
                </div>
            </div>
        </div>
    </div >
    );
}
