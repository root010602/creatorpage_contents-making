import React from "react";
import {
  FileText,
  TrendingUp,
  Users,
  Clock,
  ArrowUpRight,
  MoreVertical
} from "lucide-react";

const stats = [
  { label: "Total Content", value: "1,284", change: "+12.5%", icon: FileText, color: "text-blue-500" },
  { label: "Active Users", value: "892", change: "+5.2%", icon: Users, color: "text-indigo-500" },
  { label: "Total Views", value: "45.2K", change: "+18.3%", icon: TrendingUp, color: "text-emerald-500" },
  { label: "Avg. Engagement", value: "4m 32s", change: "+2.1%", icon: Clock, color: "text-orange-500" },
];

const recentActivity = [
  { id: 1, type: "Registration", title: "New Travel Guide", user: "Kim Min-su", time: "2 hours ago", status: "Published" },
  { id: 2, type: "Update", title: "Cafe Recommendations in Seoul", user: "Lee Ji-won", time: "5 hours ago", status: "Draft" },
  { id: 3, type: "Comment", title: "Review of Jeju Villa", user: "Park Sang-hoo", time: "Yesterday", status: "Published" },
  { id: 4, type: "Registration", title: "Winter Skiing Tips", user: "Choi Ha-neul", time: "2 days ago", status: "Under Review" },
];

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-slate-500 mt-1">Welcome back! Here&apos;s what&apos;s happening with your content today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface border border-surface-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                {stat.change}
                <ArrowUpRight size={12} />
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-surface border border-surface-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-surface-border flex justify-between items-center">
            <h3 className="font-semibold text-lg">Recent Content Activity</h3>
            <button className="text-sm text-primary font-medium hover:underline">View All</button>
          </div>
          <div className="divide-y divide-surface-border">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold">
                    {activity.user.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{activity.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{activity.user} • {activity.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${activity.status === 'Published' ? 'bg-emerald-100 text-emerald-700' :
                    activity.status === 'Draft' ? 'bg-slate-100 text-slate-600' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                    {activity.status}
                  </span>
                  <button className="text-slate-400 hover:text-slate-600">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions / Mini Stats */}
        <div className="space-y-6">
          <div className="bg-primary p-6 rounded-2xl text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="font-bold text-xl">Upgrade Your Plan</h3>
              <p className="text-indigo-100 mt-2 text-sm leading-relaxed">
                Unlock advanced analytics and unlimited content storage.
              </p>
              <button className="mt-6 bg-white text-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors">
                View Plans
              </button>
            </div>
            <TrendingUp size={120} className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform duration-500" />
          </div>

          <div className="bg-surface border border-surface-border p-6 rounded-2xl shadow-sm">
            <h3 className="font-semibold mb-4">Storage Usage</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">7.2 GB of 10 GB</span>
                <span className="font-bold">72%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '72%' }}></div>
              </div>
              <p className="text-xs text-slate-400">
                You&apos;re approaching your limit. Consider upgrading for more space.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
