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
                    <h2 className="text-3xl font-bold tracking-tight">Manage Content</h2>
                    <p className="text-slate-500 mt-1">Easily search, filter, and edit your published or draft content.</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between bg-surface border border-surface-border p-4 rounded-2xl shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search content..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-surface-border bg-slate-50/50 dark:bg-slate-800/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-surface-border rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <Filter size={16} />
                        Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-surface border border-surface-border rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-surface-border bg-slate-50/50 dark:bg-slate-800/10">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Title</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Category</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Author</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {contents.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                {item.category.charAt(0)}
                                            </div>
                                            <span className="font-medium text-sm">{item.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{item.author}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'Published' ? 'bg-emerald-100 text-emerald-700' :
                                                item.status === 'Draft' ? 'bg-slate-100 text-slate-600' :
                                                    'bg-orange-100 text-orange-700'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{item.date}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                                <Eye size={16} />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
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
                        Showing <span className="font-bold text-slate-900 dark:text-slate-100">1</span> to <span className="font-bold text-slate-900 dark:text-slate-100">5</span> of <span className="font-bold text-slate-900 dark:text-slate-100">24</span> results
                    </p>
                    <div className="flex gap-2">
                        <button className="p-2 border border-surface-border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50" disabled>
                            <ChevronLeft size={18} />
                        </button>
                        <button className="p-2 border border-surface-border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
