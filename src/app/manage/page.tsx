import React from "react";
import {
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    Edit2,
    Trash2,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

const contents = [
    { id: 1, title: "10 Secret Spots in Paris", category: "Travel", author: "Marie Dupont", status: "Published", date: "Feb 24, 2024", views: "1.2K" },
    { id: 2, title: "Best Ramen in Tokyo", category: "Food", author: "Sato Kenji", status: "Published", date: "Feb 22, 2024", views: "3.5K" },
    { id: 3, title: "Modern Home Office Setup", category: "Lifestyle", author: "Alex Rivera", status: "Draft", date: "Feb 20, 2024", views: "0" },
    { id: 4, title: "Next.js 14 Guide", category: "Technology", author: "Sarah Chen", status: "Published", date: "Feb 18, 2024", views: "8.9K" },
    { id: 5, title: "Morning Yoga Routine", category: "Health", author: "Elena Rossi", status: "Review", date: "Feb 15, 2024", views: "452" },
];

export default function ManageContent() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">콘텐츠 관리</h2>
                    <p className="text-slate-500 mt-1">등록된 콘텐츠를 검색하고 상태를 관리할 수 있습니다.</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between bg-surface border border-surface-border p-4 rounded-2xl shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="콘텐츠 제목 검색..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-surface-border bg-slate-50/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-surface-border rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                        <Filter size={16} />
                        필터
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
                        CSV 내보내기
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-surface border border-surface-border rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-surface-border bg-slate-50/50">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">제목</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">카테고리</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">작성자</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">상태</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">날짜</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {contents.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                {item.category.charAt(0)}
                                            </div>
                                            <span className="font-medium text-sm text-slate-900">{item.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-md text-slate-600">
                                            {item.category === 'Travel' ? '여행' : item.category === 'Food' ? '음식' : item.category === 'Lifestyle' ? '라이프' : item.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{item.author}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'Published' ? 'bg-emerald-100 text-emerald-700' :
                                            item.status === 'Draft' ? 'bg-slate-100 text-slate-600' :
                                                'bg-orange-100 text-orange-700'
                                            }`}>
                                            {item.status === 'Published' ? '공개' : item.status === 'Draft' ? '초고' : '검토중'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{item.date}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                                <Eye size={16} />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <button className="p-2 text-slate-400 group-hover:hidden">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-6 border-t border-surface-border flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        전체 <span className="font-bold text-slate-900">24</span>개 중 <span className="font-bold text-slate-900">1</span> - <span className="font-bold text-slate-900">5</span> 표시
                    </p>
                    <div className="flex gap-2">
                        <button className="p-2 border border-surface-border rounded-xl hover:bg-slate-50 disabled:opacity-50" disabled>
                            <ChevronLeft size={18} />
                        </button>
                        <button className="p-2 border border-surface-border rounded-xl hover:bg-slate-50">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
