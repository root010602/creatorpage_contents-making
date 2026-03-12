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
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import Image from "next/image";
import { TopNav } from "./TopNav";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, Suspense } from "react";

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
    artist_name_orig?: string;
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
    onList: () => void;
    onRefresh: () => Promise<void>;
}

function ContentRegistrationFormInner({ onList, onRefresh }: ContentRegistrationFormProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
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
                    { id: 2, spot_id: 2, title: "트랙명 2", description: "", audio_url: "", script: "이미 작성된 트랙 2의 예시 스크립트입니다...", is_free: false, order_index: 2, artwork_title_ko: "수련 연작", artwork_title_orig: "Reflets d'arbres", artist_name_ko: "클로드 모네", artwork_url: "https://www.musee-orangerie.fr/fr/oeuvres/reflets-darbres-196309", room_location: "3", sequence_number: "2" },
                    { id: 3, spot_id: 2, title: "트랙명 3", description: "", audio_url: "", image_url: "", script: "", is_free: false, order_index: 3, artwork_title_ko: "", artwork_title_orig: "", artist_name_ko: "", artwork_url: "", room_location: "", sequence_number: "3" }
                ]
            }
        ] as Chapter[]
    });
    const [contentId, setContentId] = useState<string | number | null>(null);
    const [isCityOpen, setIsCityOpen] = useState(false);
    const [activeTrackId, setActiveTrackId] = useState<number | string>(2);
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [editingName, setEditingName] = useState("");
    const [isAgreed, setIsAgreed] = useState(false);

    // 1. Initial Load from URL
    useEffect(() => {
        const stepParam = searchParams.get('step');
        const categoryParam = searchParams.get('category');

        if (stepParam) {
            const step = parseInt(stepParam);
            if (!isNaN(step) && step >= 1 && step <= 7) {
                setCurrentStep(step);
            }
        }

        if (categoryParam) {
            setFormData(prev => ({ ...prev, category: categoryParam }));
        }
    }, []); // Only on mount

    // 2. Sync State to URL
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('step', currentStep.toString());
        if (formData.category) {
            params.set('category', formData.category);
        } else {
            params.delete('category');
        }

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [currentStep, formData.category, pathname, router, searchParams]);

    // Helper to check if the current category requires a map
    const isMapCategory = (catId: string) => {
        return ['attraction', 'city_tour', 'museum'].includes(catId);
    };

    // Dynamic steps configuration
    const getSteps = () => {
        if (formData.contentType === 'electronic_book') {
            return [
                { id: 1, label: '카테고리 선택' },
                { id: 5, label: '상세 페이지 제작' },
                { id: 6, label: '최종 확인' },
                { id: 7, label: '등록 완료' }
            ];
        }

        // For Audio/Video
        return [
            { id: 1, label: '카테고리 선택' },
            { id: 2, label: '위치 및 지도 선택' },
            { id: 3, label: '위치 설정' },
            { id: 4, label: '트랙 제작' },
            { id: 5, label: '상세 페이지 제작' },
            { id: 6, label: '최종 확인' },
            { id: 7, label: '등록 완료' }
        ];
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
            artist_name_orig: "",
            artwork_url: "",
            room_location: "",
            sequence_number: ""
        };
        setFormData(prev => ({
            ...prev,
            chapters: prev.chapters.map(c => c.id === chapterId ? { ...c, tracks: [...c.tracks, newTrack] } : c)
        }));
        setActiveTrackId(newTrack.id);
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

    const updateTrack = (updates: Partial<Track>) => {
        if (!activeTrackId) return;
        setFormData(prev => ({
            ...prev,
            chapters: prev.chapters.map(c => ({
                ...c,
                tracks: c.tracks.map(t => t.id === activeTrackId ? { ...t, ...updates } : t)
            }))
        }));
    };

    const getCurrentTrack = () => {
        for (const chapter of formData.chapters) {
            const track = chapter.tracks.find(t => t.id === activeTrackId);
            if (track) return track;
        }
        return null;
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
        if (!isSupabaseConfigured) {
            console.log(`[Mock Upload] File: ${file.name} to Bucket: ${bucket}`);
            return URL.createObjectURL(file); // Return a local URL for preview
        }

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
            if (!isSupabaseConfigured) {
                console.log("[Mock Save] Data saving skipped (Supabase not configured):", formData);
                if (onRefresh) await onRefresh();
                return true;
            }

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

                if (savedSpots) {
                    savedSpots.forEach((spot, idx) => {
                        spotIdMap[formData.spots[idx].id] = spot.id;
                    });
                }
            }

            // 3. Save Tracks using saved spot IDs
            const allTracks = formData.chapters.flatMap(c => c.tracks);
            if (allTracks.length > 0) {
                const tracksToInsert = allTracks.map(t => ({
                    content_id: currentContentId,
                    spot_id: t.spot_id && t.spot_id !== 'none' ? spotIdMap[t.spot_id as keyof typeof spotIdMap] : null,
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
        const isDetailPageStep = currentStep === 5;

        if (isDetailPageStep) {
            // saveData will still run, but won't block navigation even if fields are empty
            await saveData();
        }

        if (currentStep === 6) {
            if (!isAgreed) {
                alert("필수 확인 사항에 동의해 주세요.");
                return;
            }
        }

        if (nextStep) {
            setCurrentStep(nextStep);
        } else {
            if (currentStep === 1) {
                if (formData.contentType === 'electronic_book') {
                    setCurrentStep(5); // Go straight to Detail Page
                } else if (!isMapCategory(formData.category)) {
                    // Non-map categories go straight to Step 4
                    setFormData(prev => ({ ...prev, mapType: 'none' }));
                    setCurrentStep(4);
                } else {
                    setCurrentStep(2);
                }
            } else if (currentStep === 2) {
                if (formData.mapType === 'none' && !isMapCategory(formData.category)) {
                    setCurrentStep(4);
                } else if (formData.mapType === 'none') {
                    setCurrentStep(4);
                } else {
                    setCurrentStep(3);
                }
            } else if (currentStep === 3) {
                setCurrentStep(4);
            } else if (currentStep === 4) {
                setCurrentStep(5);
            } else if (currentStep === 5) {
                setCurrentStep(6);
            } else if (currentStep === 6) {
                setCurrentStep(7);
            } else {
                setCurrentStep((prev) => Math.min(prev + 1, 7));
            }
        }
    };

    return (
        <div className="w-full min-h-screen bg-[#FCFBF9] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <TopNav />

            <div className="pt-16 pb-20">
                <div className="w-full px-6 md:px-10 py-10">
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-8 max-w-[1400px] mx-auto px-4">
                        콘텐츠 등록 및 수정
                    </h2>
                    {/* Stepper Navigation Card */}
                    {currentStep < 7 && (
                        <div className="bg-white p-10 md:p-12 rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white mb-10 overflow-hidden max-w-[1400px] mx-auto">
                            <div className="relative flex justify-between items-center max-w-4xl mx-auto">
                                <div className="absolute top-[32px] left-0 w-full h-[3px] bg-slate-100 -z-0 rounded-full" />
                                <div
                                    className="absolute top-[32px] left-0 h-[3px] bg-primary transition-all duration-700 ease-in-out -z-0 rounded-full"
                                    style={{ width: `${steps.length > 1 ? (Math.max(0, steps.findIndex(s => s.id === currentStep)) / (steps.length - 1)) * 100 : 0}%` }}
                                />

                                {steps.map((step, index) => {
                                    const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
                                    const isActive = currentStep === step.id;

                                    return (
                                        <div
                                            key={step.id}
                                            className="flex flex-col items-center group relative cursor-pointer z-10"
                                            onClick={() => handleStepChange(step.id)}
                                        >
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-500 ${isActive ? "bg-primary text-white scale-110 shadow-xl shadow-primary/30" : isCompleted ? "bg-slate-900 text-white" : "bg-white text-slate-300 border-2 border-slate-100 group-hover:border-slate-200"}`}>
                                                {isCompleted ? <CheckCircle2 size={32} /> : (index + 1)}
                                            </div>
                                            <span className={`absolute -bottom-12 whitespace-nowrap text-base font-normal tracking-tight transition-all duration-300 ${isActive ? "text-slate-900 scale-110" : "text-slate-400 group-hover:text-slate-600"}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-24 pt-10 border-t border-slate-50 text-slate-400 text-base font-normal flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    <p className="tracking-tight text-lg">콘텐츠 정보를 단계별로 입력해 주세요</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-normal text-slate-900">{String(currentStep).padStart(2, '0')}</span>
                                    <span className="text-slate-300 mx-2 text-xl">/</span>
                                    <span className="text-slate-300 text-xl font-normal">06</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={`${currentStep === 4 ? "w-full" : "max-w-[1400px] mx-auto px-6 md:px-10 mb-20"} space-y-8`}>
                        {/* Step Content... */}



                        {/* Step Content: Step 1 (Premium UI Overhaul) */}
                        <div className="space-y-8 mb-20">
                            {currentStep === 1 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    {/* 1. 콘텐츠 유형 Selection Tiles */}
                                    <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white p-10 space-y-8">
                                        <div className="flex flex-col space-y-2 mb-8">
                                            <h3 className="text-xl font-bold text-slate-900">콘텐츠 유형*</h3>
                                            <p className="text-slate-400 text-base font-normal">등록하실 콘텐츠의 형식을 선택해 주세요.</p>
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
                                    <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white p-10 space-y-8">
                                        <div className="flex flex-col space-y-2 mb-8">
                                            <h3 className="text-xl font-bold text-slate-900">카테고리*</h3>
                                            <p className="text-slate-400 text-base font-normal">콘텐츠의 성격을 가장 잘 나타내는 항목을 선택해 주세요.</p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            {[
                                                { id: 'attraction', label: '명소', desc: '유적지, 랜드마크' },
                                                { id: 'city_tour', label: '시티투어', desc: '워킹투어, 야경투어' },
                                                { id: 'museum', label: '미술관 / 박물관', desc: '전시 해설, 추천 동선' },
                                                { id: 'guidebook', label: '가이드북', desc: '리얼 가이드, 매뉴얼' },
                                                { id: 'story', label: '여행이야기', desc: '지식, 인문학' }
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
                                    <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white p-10 space-y-8">
                                        <div className="flex flex-col space-y-2">
                                            <h3 className="text-xl font-bold text-slate-900">도시*</h3>
                                        </div>

                                        <div className="space-y-6">
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
                                </div>
                            )}


                            {currentStep === 2 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    {/* 1. 박물관/미술관 전용 (Only if category is museum) */}
                                    {formData.category === "museum" && (
                                        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white p-10 space-y-8">
                                            <div className="flex flex-col space-y-2 mb-8">
                                                <h3 className="text-xl font-bold text-slate-900">시설 정보*</h3>
                                                <p className="text-slate-400 text-base font-normal">박물관 또는 미술관의 정보를 입력해 주세요.</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <label className="text-[14px] font-bold text-slate-700 ml-1">기관명 (검색/입력)</label>
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
                                                    <label className="text-[14px] font-bold text-slate-700 ml-1">공식 홈페이지 링크 (선택)</label>
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
                                    <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white p-10 space-y-8">
                                        {!isMapCategory(formData.category) ? (
                                            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                                    <XCircle size={40} className="text-slate-300" />
                                                </div>
                                                <h4 className="text-xl font-bold text-slate-800 mb-2">지도가 필요하지 않은 카테고리입니다</h4>
                                                <p className="text-slate-500">선택하신 카테고리는 지도 설정 단계를 건너뜁니다.</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col space-y-2 mb-8">
                                                        <h3 className="text-xl font-bold text-slate-900">지도 활용*</h3>
                                                        <p className="text-slate-400 text-base font-normal">여행자가 길을 찾으려면 어떤 지도가 필요한가요?</p>
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
                                                    ]
                                                        .filter(map => map.id !== 'none' || !isMapCategory(formData.category))
                                                        .map((map) => (
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
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && formData.contentType === 'audio_video' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    {/* Location Setup */}
                                    <div className="space-y-8">
                                        {!isMapCategory(formData.category) ? (
                                            <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white p-20 flex flex-col items-center justify-center animate-in fade-in duration-500">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                                    <Map size={40} className="text-slate-300" />
                                                </div>
                                                <h4 className="text-xl font-bold text-slate-800 mb-2">지도가 필요하지 않은 카테고리입니다</h4>
                                                <p className="text-slate-500">다음 단계를 통해 트랙을 바로 구성하실 수 있습니다.</p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Google Map Section (Shown if google_map or both) */}
                                                {(formData.mapType === 'google_map' || formData.mapType === 'both') && (
                                                    <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white p-10 space-y-6">
                                                        <div className="flex flex-col space-y-2 mb-8">
                                                            <h3 className="text-xl font-bold text-slate-900">
                                                                외부 구글맵 설정 {formData.mapType === 'both' ? '(스팟 지정)' : ''}
                                                            </h3>
                                                            <p className="text-slate-400 text-base font-normal">콘텐츠가 재생될 외부 위치를 지도에 핀으로 표시해 주세요.</p>
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
                                                    <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white p-10 space-y-6">
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
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500 relative max-w-[1400px] mx-auto">
                                    <div className="flex flex-col md:flex-row gap-8 items-start">
                                        {/* Left: Sidebar Track List (Sticky) */}
                                        <div className="w-full md:w-[320px] sticky top-10 flex flex-col bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white overflow-hidden h-[calc(100vh-140px)]">
                                            <div className="p-8 border-b border-slate-50">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Map size={24} className="text-[#F47521]" />
                                                        <h3 className="text-[20px] font-black text-slate-900">투어 트랙</h3>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={addChapter}
                                                            className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center"
                                                        >
                                                            <Plus size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar">
                                                {formData.chapters.map((chapter) => (
                                                    <div key={chapter.id} className="space-y-3">
                                                        <div className="flex items-center justify-between group px-3 py-2.5 bg-[#F8F9FA] rounded-2xl">
                                                            <div className="flex items-center gap-2">
                                                                <ChevronDown size={14} className="text-slate-400" />
                                                                {editingId === chapter.id ? (
                                                                    <input
                                                                        autoFocus
                                                                        value={editingName}
                                                                        onChange={(e) => setEditingName(e.target.value)}
                                                                        onBlur={() => updateChapterName(chapter.id, editingName)}
                                                                        onKeyDown={(e) => e.key === 'Enter' && updateChapterName(chapter.id, editingName)}
                                                                        className="text-sm font-bold text-slate-800 bg-white border border-primary/30 rounded px-1 outline-none w-24"
                                                                    />
                                                                ) : (
                                                                    <span
                                                                        className="text-[15px] font-bold text-slate-800 cursor-pointer hover:text-primary transition-colors"
                                                                        onClick={() => { setEditingId(chapter.id); setEditingName(chapter.name); }}
                                                                    >
                                                                        {chapter.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => addTrack(chapter.id)} className="p-1 hover:text-primary text-slate-400 transition-colors"><Plus size={14} /></button>
                                                                <button onClick={() => deleteChapter(chapter.id)} className="p-1 hover:text-red-500 text-slate-400 transition-colors"><XCircle size={14} /></button>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2 pl-3 ml-3 border-l-[1.5px] border-slate-100">
                                                            {chapter.tracks.map((track) => {
                                                                const isActive = activeTrackId === track.id;
                                                                return (
                                                                    <div
                                                                        key={track.id}
                                                                        onClick={() => { setActiveTrackId(track.id); }}
                                                                        className={`group relative flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl cursor-pointer transition-all ${isActive
                                                                            ? "bg-white border-2 border-[#F47521] shadow-lg shadow-[#F47521]/10"
                                                                            : "bg-white border border-slate-50 hover:border-slate-200"
                                                                            }`}
                                                                    >
                                                                        <div className="flex items-center gap-3 min-w-0">
                                                                            {isActive ? (
                                                                                <div className="w-5 h-5 rounded-full border-2 border-[#F47521] flex items-center justify-center">
                                                                                    <div className="w-2 h-2 rounded-full bg-[#F47521]" />
                                                                                </div>
                                                                            ) : (
                                                                                <div className="w-2.5 h-2.5 rounded-full bg-slate-200 ml-1.5 mr-1" />
                                                                            )}
                                                                            <span className={`text-[14px] font-medium truncate ${isActive ? "text-[#F47521] font-bold" : "text-slate-500"}`}>
                                                                                {track.title}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); deleteTrack(chapter.id, track.id); }}
                                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all text-slate-300"
                                                                            >
                                                                                <XCircle size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Right: Track Content Form (Independently Scrollable) */}
                                        <div className="flex-1 bg-white rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white p-12 h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
                                            <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4 mb-8 flex items-center justify-between">
                                                오디오 / 비디오 가이드 제작
                                                <span className="text-sm font-medium text-slate-400">트랙 {activeTrackId} 편집 중</span>
                                            </h3>

                                            <div className="space-y-10">
                                                {/* Basic Settings: Track Name & Spot */}
                                                <div className="space-y-8 pb-10 border-b border-slate-50">
                                                    <h3 className="text-xl font-bold text-slate-900">기본 설정</h3>
                                                    <div className={`grid grid-cols-1 ${isMapCategory(formData.category) ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-8`}>
                                                        <div className="space-y-4">
                                                            <label className="text-[14px] font-bold text-slate-700 ml-1">트랙명*</label>
                                                            <input
                                                                type="text"
                                                                placeholder="트랙 이름을 입력해 주세요"
                                                                value={getCurrentTrack()?.title || ""}
                                                                onChange={(e) => updateTrack({ title: e.target.value })}
                                                                className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-[#F47521] focus:shadow-xl focus:shadow-[#F47521]/5 outline-none transition-all text-base font-medium placeholder:text-slate-300"
                                                            />
                                                        </div>
                                                        {isMapCategory(formData.category) && (
                                                            <div className="space-y-4">
                                                                <label className="text-[14px] font-bold text-slate-700 ml-1 flex items-center gap-2">
                                                                    연결할 스팟 선택*
                                                                    {formData.mapType !== 'none' && <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">필수</span>}
                                                                </label>
                                                                <div className="relative">
                                                                    <select
                                                                        disabled={formData.mapType === 'none'}
                                                                        value={getCurrentTrack()?.spot_id || ""}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;
                                                                            updateTrack({ spot_id: val === 'none' ? 'none' : Number(val) });
                                                                        }}
                                                                        className={`appearance-none w-full px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none transition-all font-medium text-slate-700 ${formData.mapType === 'none' ? 'bg-slate-100 cursor-not-allowed opacity-50' : 'bg-slate-50/50 hover:bg-white hover:border-slate-200 focus:bg-white focus:border-[#F47521] focus:shadow-xl focus:shadow-[#F47521]/5 cursor-pointer'}`}
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
                                                    </div>
                                                </div>

                                                {/* Track File */}
                                                <div className="space-y-6">
                                                    <h3 className="text-xl font-bold text-slate-900">트랙 파일*</h3>
                                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 p-6 rounded-3xl border-2 border-slate-50 bg-[#F8F9FA]/50 group hover:bg-white hover:border-slate-200 transition-all duration-300">
                                                        <label className="px-8 py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-95 whitespace-nowrap shadow-lg shadow-slate-900/10 cursor-pointer flex items-center gap-2">
                                                            <Plus size={18} />
                                                            파일 업로드
                                                            <input type="file" className="hidden" accept="audio/*,video/*" onChange={(e) => handleFileUpload(e, 'track')} />
                                                        </label>
                                                        <div className="flex-1 space-y-3">
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="font-bold text-slate-700 truncate max-w-[200px] flex items-center gap-2">
                                                                    {formData.tracks.find(t => t.id === activeTrackId)?.audio_url ? (
                                                                        <>
                                                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                                                            <span className="text-emerald-600">파일 업로드됨</span>
                                                                        </>
                                                                    ) : "파일을 선택해 주세요"}
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
                                                        <div
                                                            className="flex items-center gap-3 sm:ml-4 border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-6 cursor-pointer group/toggle"
                                                            onClick={() => updateTrack({ is_free: !getCurrentTrack()?.is_free })}
                                                        >
                                                            <div className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner ${getCurrentTrack()?.is_free ? 'bg-[#F47521]' : 'bg-slate-200'}`}>
                                                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm ${getCurrentTrack()?.is_free ? 'right-1' : 'left-1'}`}></div>
                                                            </div>
                                                            <div className="text-xs text-slate-500 font-bold whitespace-nowrap">
                                                                무료 듣기<br /><span className="font-normal text-[10px] text-slate-400">체크 시 샘플 파일로 제공</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Script Area */}
                                                <div className="space-y-6 relative">
                                                    <div className="flex flex-col gap-2">
                                                        <h3 className="text-xl font-bold text-slate-900">스크립트*</h3>
                                                        <p className="text-slate-400 text-base font-normal">여행자들이 현장에서 듣게 될 상세 스크립트를 작성해 주세요.</p>
                                                    </div>
                                                    <div className="border-2 border-slate-50 rounded-[32px] bg-[#F8F9FA]/50 focus-within:bg-white focus-within:border-[#F47521] focus-within:shadow-xl focus-within:shadow-[#F47521]/5 transition-all overflow-hidden flex flex-col p-1">
                                                        <textarea
                                                            key={`track-script-${activeTrackId}`}
                                                            placeholder={`<스크립트 작성 팁>\n• 여행자들이 이 장소에 대해 뭘 알면 좋을지, 꼭 알아야 할 중요한 내용\n• 구어체로, 실제로 말하듯이!\n• 너무 많은 정보를 나열하지 말고 간단 명료하게\n• 번역 말투, 어려운 전문적인 단어 X`}
                                                            className="w-full h-[400px] p-8 outline-none resize-none text-[16px] leading-[1.8] text-slate-700 bg-transparent flex-1 placeholder:text-slate-300"
                                                            value={getCurrentTrack()?.script || ""}
                                                            onChange={(e) => updateTrack({ script: e.target.value })}
                                                        ></textarea>
                                                    </div>
                                                </div>

                                                {/* Track Image Upload */}
                                                <div className="space-y-6">
                                                    <div className="flex flex-col gap-2">
                                                        <h3 className="text-xl font-bold text-slate-900">트랙 대표 이미지*</h3>
                                                        <p className="text-slate-400 text-base font-normal">이 트랙을 가장 잘 설명하는 이미지를 업로드해 주세요.</p>
                                                    </div>
                                                    <div className="flex items-center gap-8 p-8 rounded-[32px] border-2 border-slate-50 bg-[#F8F9FA]/50 hover:bg-white hover:border-slate-100 transition-all duration-300">
                                                        <div className="w-56 h-32 rounded-2xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center text-slate-300 shadow-sm">
                                                            {getCurrentTrack()?.image_url ? (
                                                                <Image src={getCurrentTrack()?.image_url || ""} width={224} height={128} className="w-full h-full object-cover" alt="Track Preview" />
                                                            ) : <ImageIcon size={40} />}
                                                        </div>
                                                        <div className="flex flex-col gap-4">
                                                            <label className="px-8 py-3.5 bg-white border-2 border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 text-base font-bold text-slate-700 transition-all cursor-pointer text-center">
                                                                대표이미지 선택
                                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'track_image')} />
                                                            </label>
                                                            <p className="text-xs text-slate-400 ml-1">• 1200x675 권장 / 5MB 이하</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Artwork Information (Conditional) */}
                                                {formData.contentType === 'audio_video' && formData.category === 'museum' && (
                                                    <div className="space-y-8 pt-10 border-t border-slate-50 animate-in fade-in duration-500">
                                                        <div className="flex flex-col gap-2">
                                                            <h3 className="text-xl font-bold text-slate-900">작품 정보</h3>
                                                            <p className="text-slate-400 text-base font-normal">오디오 가이드를 위해 작품의 상세 정보를 입력해 주세요.</p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-x-10 gap-y-8 bg-[#F8F9FA]/30 p-10 rounded-[32px] border border-slate-50">
                                                            {[
                                                                { label: '작품명 (원어)*', key: 'artwork_title_orig', placeholder: 'Original title' },
                                                                { label: '작품명 (한글명)*', key: 'artwork_title_ko', placeholder: '작품의 한글 이름을 입력하세요' },
                                                                { label: '작가명 (원어명)*', key: 'artist_name_orig', placeholder: 'Original artist name' },
                                                                { label: '작가명 (한글명)*', key: 'artist_name_ko', placeholder: '작가의 한글 이름을 입력하세요' },
                                                                { label: '공식 홈페이지 작품 정보 URL*', key: 'artwork_url', placeholder: 'https://...' },
                                                            ].map((field) => (
                                                                <div key={field.key} className={`${field.key === 'artwork_url' ? 'col-span-2' : ''} space-y-3`}>
                                                                    <label className="text-[14px] font-bold text-slate-700 ml-1">{field.label}</label>
                                                                    <input
                                                                        type="text"
                                                                        placeholder={field.placeholder}
                                                                        value={((getCurrentTrack() as unknown as Record<string, string | number>)?.[field.key]) || ""}
                                                                        onChange={(e) => updateTrack({ [field.key]: e.target.value })}
                                                                        className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-white focus:border-[#F47521] focus:shadow-xl focus:shadow-[#F47521]/5 outline-none transition-all text-base font-medium placeholder:text-slate-300"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 5 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                    {/* 1. 콘텐츠 이름 */}
                                    <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white p-10 space-y-6">
                                        <div className="flex flex-col space-y-2 mb-8">
                                            <h3 className="text-xl font-bold text-slate-900">콘텐츠 이름*</h3>
                                            <p className="text-slate-400 text-base font-normal">등록하시고자 하는 콘텐츠의 특성과 지역이 잘 드러나는 키워드를 사용해 주세요.</p>
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
                                    <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white p-10 space-y-6">
                                        <div className="flex flex-col space-y-2 mb-8">
                                            <h3 className="text-xl font-bold text-slate-900">콘텐츠 소개글*</h3>
                                            <p className="text-slate-400 text-base font-normal">여행자에게 이 콘텐츠의 매력을 상세하게 설명해 주세요. (최대 1000자)</p>
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
                                    <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white p-10 space-y-6">
                                        <div className="flex flex-col space-y-2 mb-8">
                                            <h3 className="text-xl font-bold text-slate-900">콘텐츠 가격*</h3>
                                            <p className="text-slate-400 text-base font-normal">판매하실 가격을 설정해 주세요.</p>
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
                                    <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white p-10 space-y-8">
                                        <div className="flex flex-col space-y-2 mb-8">
                                            <h3 className="text-xl font-bold text-slate-900">이미지 업로드*</h3>
                                            <p className="text-slate-400 text-base font-normal">권장 규격 1200*645, 용량 5mb 미만</p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 max-w-2xl">
                                            {/* Thumbnail */}
                                            <div className="group relative flex items-center gap-6 p-6 rounded-3xl border-2 border-primary/20 bg-primary/5 hover:border-primary/40 transition-all">
                                                <div className="w-32 h-20 rounded-xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center text-slate-300">
                                                    {formData.thumbnailPreview ? (
                                                        <Image src={formData.thumbnailPreview} width={128} height={80} className="w-full h-full object-cover" alt="Thumbnail Preview" />
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
                                        </div>
                                    </div>

                                    {/* 5. 콘텐츠 파일 업로드 (Only for Ebook - previously in step 3) */}
                                    {formData.contentType === 'electronic_book' && (
                                        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white p-10 space-y-6">
                                            <div className="flex flex-col space-y-2 mb-8">
                                                <h3 className="text-xl font-bold text-slate-900">epub 파일 업로드*</h3>
                                                <p className="text-slate-400 text-base font-normal">.epub 형식의 파일을 선택해 주세요.</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <label className="px-10 py-6 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-lg rounded-2xl transition-all flex items-center gap-3 border-2 border-dashed border-primary/30 cursor-pointer">
                                                    {formData.epubFileName ? <FileText size={24} /> : <Plus size={24} />}
                                                    {formData.epubFileName || "파일 선택"}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept=".epub"
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
                                            <p className="text-xs text-slate-400 ml-1">• .epub 형식의 파일만 업로드 가능합니다.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {currentStep === 6 && (
                                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                    {/* 1. 앱 화면 확인하기 */}
                                    <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white p-10 space-y-8">
                                        <div className="flex flex-col space-y-2">
                                            <h3 className="text-xl font-bold text-slate-900">앱에서 최종 확인하기</h3>
                                            <p className="text-slate-400 text-base font-normal">직접 만든 콘텐츠를 투어라이브 앱에서 확인하세요</p>
                                        </div>

                                        <div className="p-8 rounded-[32px] bg-slate-50/50 border-2 border-slate-50 space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Left: App Preview Card */}
                                                <div className="bg-white/50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-center items-center text-center space-y-4">
                                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                                        <Globe size={24} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-slate-900 font-bold">
                                                            [필수] 아래 버튼을 눌러야 앱에서 확인하실 수 있습니다
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => window.open('https://tourlive.co.kr/preview', '_blank')}
                                                        className="w-full py-3 bg-white border-2 border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 text-sm font-bold text-slate-700 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <PlayCircle size={16} className="text-primary" />
                                                        투어라이브 앱에서 확인하기
                                                    </button>
                                                </div>

                                                {/* Right: Checklist */}
                                                <div className="space-y-4">
                                                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                                        <CheckCircle2 size={18} className="text-primary" />
                                                        최종 체크리스트
                                                    </h4>
                                                    <ul className="space-y-2 pl-2">
                                                        {[
                                                            "투어 상세 페이지가 정상적으로 보이는지",
                                                            "스크립트에 오타는 없는지",
                                                            "재생에 문제가 없는지",
                                                            "지도 위치가 정확한지",
                                                            "이미지가 잘 깨지지 않고 잘 보이는지",
                                                            "투어 가격 반영이 되었는지",
                                                            "[오디오/비디오] 콘텐츠의 경우 무료 듣기 설정이 의도한 대로 되었는지"
                                                        ].map((item, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                                                                <span className="leading-relaxed">{item}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Placeholder for App Confirmation Method */}
                                            <div className="pt-6 border-t border-slate-100">
                                                <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                                                    <h4 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                                                        <Layers size={16} />
                                                        앱에서 확인하는 방법
                                                    </h4>
                                                    <div className="text-sm text-slate-500 bg-white/40 rounded-xl p-4 border border-dashed border-primary/20">
                                                        <p>※ 크리에이터 전용 시크릿 경로를 통한 확인 방법이 곧 안내될 예정입니다.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. 심사 요청 가이드라인 */}
                                    <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white p-10 space-y-10">
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-bold text-slate-900">반드시 최종 확인하세요</h3>
                                            <p className="text-[#F47521] text-base font-bold">아래 금지 항목이 포함된 콘텐츠는 심사 반려 또는 제재 대상이 됩니다.</p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 pl-2">
                                            {[
                                                { text: "제 3자의 권리(초상권, 저작권 등)를 침해하거나 상업적으로 이용 불가능함", highlights: ["초상권, 저작권 등", "침해"] },
                                                { text: "부적절한 언어 (욕설, 혐오 표현, 비방 등)" },
                                                { text: "성인용 콘텐츠" },
                                                { text: "폭력 - 상처, 손상, 상해를 보여주는 상황" },
                                                { text: "시청자에게 혼란, 혐오감, 충격을 줄 수 있는 이미지 또는 언어" },
                                                { text: "기분전환용 약물 복용 관련" },
                                                { text: "부정 행위를 미화하거나 조장" },
                                                { text: "특정 집단 또는 개인에 대한 증오심, 경멸, 괴롭힘" }
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex items-start gap-3 group">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2.5 transition-colors group-hover:bg-primary" />
                                                    <p className="text-slate-600 font-normal leading-relaxed">
                                                        {item.highlights ? (
                                                            item.text.split(new RegExp(`(${item.highlights.join('|')})`, 'g')).map((part, i) =>
                                                                item.highlights?.includes(part)
                                                                    ? <span key={i} className="text-red-500 font-bold">{part}</span>
                                                                    : part
                                                            )
                                                        ) : item.text}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Final Agreement Checkbox */}
                                        <div className="pt-8 border-t border-slate-50">
                                            <label className="flex items-center gap-4 cursor-pointer group">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={isAgreed}
                                                        onChange={(e) => setIsAgreed(e.target.checked)}
                                                    />
                                                    <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${isAgreed ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'border-slate-200 bg-white group-hover:border-slate-300'}`}>
                                                        {isAgreed && <CheckCircle2 size={16} className="text-white" />}
                                                    </div>
                                                </div>
                                                <span className="text-slate-700 font-bold select-none">
                                                    위 금지 사항이 포함되지 않았음을 확인하며, 허위 확인 시 모든 책임은 본인에게 있음을 동의합니다.
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 7 && (
                                <div className="bg-white rounded-[40px] border border-surface-border shadow-sm p-16 animate-in fade-in zoom-in-95 duration-700 text-center space-y-8">
                                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                        <CheckCircle2 size={48} />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-3xl font-black text-slate-900">심사 요청 완료!</h3>
                                        <p className="text-slate-500 text-lg leading-relaxed max-w-md mx-auto">
                                            축하합니다! 콘텐츠 심사 요청이 성공적으로 완료되었습니다.<br />
                                            관리자의 승인 후 정식 판매될 예정입니다.
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
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] z-50">
                        <div className="max-w-[1400px] mx-auto px-10 py-3 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    if (currentStep === 7) {
                                        setCurrentStep(6);
                                    } else if (currentStep === 6) {
                                        setCurrentStep(5);
                                    } else if (currentStep === 5) {
                                        if (formData.contentType === 'electronic_book') {
                                            setCurrentStep(1);
                                        } else {
                                            setCurrentStep(4);
                                        }
                                    } else if (currentStep === 4) {
                                        if (!isMapCategory(formData.category)) {
                                            setCurrentStep(1);
                                        } else {
                                            setCurrentStep(formData.mapType === 'none' ? 2 : 3);
                                        }
                                    } else if (currentStep === 3) {
                                        setCurrentStep(2);
                                    } else {
                                        setCurrentStep(prev => Math.max(1, prev - 1));
                                    }
                                }}
                                disabled={currentStep === 1 || currentStep === 7}
                                className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-20 disabled:hover:bg-transparent text-sm"
                            >
                                이전 단계로
                            </button>
                            {currentStep !== 7 && (
                                <button
                                    onClick={() => {
                                        if (currentStep === 6) {
                                            if (!isAgreed) return;
                                            handleSaveAndNext();
                                        } else {
                                            handleSaveAndNext();
                                        }
                                    }}
                                    disabled={loading || (currentStep === 6 && !isAgreed)}
                                    className={`px-10 py-3 font-bold rounded-xl shadow-xl transition-all active:scale-[0.98] flex items-center gap-2 text-sm ${currentStep === 6 && !isAgreed
                                        ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                        : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10"
                                        }`}
                                >
                                    {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : null}
                                    {currentStep === 6 ? "심사 요청하기" : "저장 및 다음 단계로"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function ContentRegistrationForm(props: ContentRegistrationFormProps) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center">기타 설정 로딩 중...</div>}>
            <ContentRegistrationFormInner {...props} />
        </Suspense>
    );
}
