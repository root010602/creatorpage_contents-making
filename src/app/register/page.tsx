"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Globe, Tag, FileText, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function RegisterContent() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        content_type: "audio",
        category: "travel",
        city: "",
        description: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
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
            router.push("/manage");
        } catch (error) {
            console.error("Error inserting data:", error);
            const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
            alert("등록 중 오류가 발생했습니다: " + message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-white rounded-xl border border-surface-border transition-colors group"
                >
                    <ChevronLeft size={20} className="text-slate-400 group-hover:text-primary" />
                </button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">콘텐츠 등록</h2>
                    <p className="text-slate-500 mt-1">새로운 투어라이브 콘텐츠 정보를 직접 입력해 주세요.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Title */}
                        <div className="bg-surface p-6 rounded-3xl border border-surface-border shadow-sm space-y-4">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <FileText size={18} className="text-primary" />
                                콘텐츠 제목
                            </label>
                            <input
                                required
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                type="text"
                                placeholder="예: 파리 루브르 박물관 투어"
                                className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-slate-50/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>

                        {/* Content Type */}
                        <div className="bg-surface p-6 rounded-3xl border border-surface-border shadow-sm space-y-4">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <Globe size={18} className="text-primary" />
                                콘텐츠 유형
                            </label>
                            <select
                                name="content_type"
                                value={formData.content_type}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-slate-50/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="audio">오디오 가이드</option>
                                <option value="video">워킹 투어 (영상)</option>
                                <option value="text">E-북 / 가이드북</option>
                            </select>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Category */}
                        <div className="bg-surface p-6 rounded-3xl border border-surface-border shadow-sm space-y-4">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <Tag size={18} className="text-primary" />
                                카테고리
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-slate-50/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="travel">여행 / 투어</option>
                                <option value="history">역사 / 문화</option>
                                <option value="food">음식 / 맛집</option>
                                <option value="lifestyle">라이프스타일</option>
                            </select>
                        </div>

                        {/* City */}
                        <div className="bg-surface p-6 rounded-3xl border border-surface-border shadow-sm space-y-4">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <MapPin size={18} className="text-primary" />
                                도시
                            </label>
                            <input
                                required
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                type="text"
                                placeholder="예: 서울, 도쿄, 파리"
                                className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-slate-50/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="bg-surface p-6 rounded-3xl border border-surface-border shadow-sm space-y-4">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        콘텐츠 설명
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={5}
                        placeholder="이 투어에 대한 핵심 설명을 입력해 주세요."
                        className="w-full px-4 py-3 rounded-2xl border border-surface-border bg-slate-50/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                    />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
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
    );
}
