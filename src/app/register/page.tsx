import React from "react";
import {
    Save,
    Image as ImageIcon,
    Tag,
    FileText,
    Plus,
    Info
} from "lucide-react";

export default function RegisterContent() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Register New Content</h2>
                    <p className="text-slate-500 mt-1">Fill in the details below to publish new content to the platform.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 border border-surface-border rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        Save Draft
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors flex items-center gap-2">
                        <Save size={18} />
                        Publish Content
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface border border-surface-border rounded-2xl p-8 shadow-sm space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <FileText size={16} className="text-slate-400" />
                                Content Title
                            </label>
                            <input
                                type="text"
                                placeholder="Enter a descriptive title..."
                                className="w-full px-4 py-3 rounded-xl border border-surface-border bg-slate-50/50 dark:bg-slate-800/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold flex items-center gap-2">
                                <Info size={16} className="text-slate-400" />
                                Description
                            </label>
                            <textarea
                                rows={6}
                                placeholder="Write your content here..."
                                className="w-full px-4 py-3 rounded-xl border border-surface-border bg-slate-50/50 dark:bg-slate-800/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Category</label>
                                <select className="w-full px-4 py-3 rounded-xl border border-surface-border bg-slate-50/50 dark:bg-slate-800/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                                    <option>Travel</option>
                                    <option>Food</option>
                                    <option>Lifestyle</option>
                                    <option>Technology</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Visibility</label>
                                <select className="w-full px-4 py-3 rounded-xl border border-surface-border bg-slate-50/50 dark:bg-slate-800/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                                    <option>Public</option>
                                    <option>Private</option>
                                    <option>Scheduled</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-surface-border rounded-2xl p-8 shadow-sm space-y-4">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <Tag size={16} className="text-slate-400" />
                            Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['Travel', 'Seoul', 'Guide'].map(tag => (
                                <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium flex items-center gap-2">
                                    {tag}
                                    <button className="text-slate-400 hover:text-red-500">×</button>
                                </span>
                            ))}
                            <button className="px-3 py-1 border border-dashed border-surface-border rounded-lg text-xs font-medium text-slate-400 hover:border-primary hover:text-primary transition-colors flex items-center gap-1">
                                <Plus size={12} />
                                Add Tag
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar / Options */}
                <div className="space-y-6">
                    <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="font-semibold">Featured Image</h3>
                        <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-dashed border-surface-border flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-primary/50 cursor-pointer transition-all">
                            <ImageIcon size={32} />
                            <span className="text-xs font-medium">Click to upload image</span>
                        </div>
                    </div>

                    <div className="bg-surface border border-surface-border rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="font-semibold">Publishing Checklist</h3>
                        <ul className="space-y-3">
                            {[
                                { label: "Title added", done: true },
                                { label: "Content written", done: false },
                                { label: "Category selected", done: true },
                                { label: "Tags included", done: true },
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? 'bg-emerald-100 text-emerald-600' : 'border border-surface-border text-transparent'}`}>
                                        {item.done && <Plus size={12} className="rotate-45" />} {/* Just a placeholder tick */}
                                    </div>
                                    <span className={item.done ? 'text-slate-400 line-through' : 'text-slate-600'}>{item.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
