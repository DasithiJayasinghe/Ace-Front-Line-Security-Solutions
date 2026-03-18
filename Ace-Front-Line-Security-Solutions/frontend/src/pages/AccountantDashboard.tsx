import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Users,
    FileCheck,
    CheckCircle,
    Banknote,
    Plus,
    LayoutList,
    TrendingUp,
    Clock,
    Loader2
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import { toast } from "sonner";
import { format } from "date-fns";

const data = [
    { name: "Jul", value: 90 },
    { name: "Aug", value: 94 },
    { name: "Sep", value: 92 },
    { name: "Oct", value: 97 },
    { name: "Nov", value: 99 },
    { name: "Dec", value: 100 },
];

interface DashboardStats {
    totalOfficers: number;
    pendingPayrolls: number;
    paidThisMonth: number;
    totalPayout: number;
}

const AccountantDashboard = () => {
    const [statsData, setStatsData] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch("http://localhost:8080/api/payroll/stats");
                if (response.ok) {
                    const data = await response.json();
                    setStatsData(data);
                } else {
                    console.error("Failed to fetch dashboard stats:", response.status);
                    toast.error("Failed to load real-time statistics.");
                }
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
                toast.error("Connection error while fetching statistics.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const stats = [
        {
            label: "Total Officers",
            value: statsData?.totalOfficers?.toString() || (loading ? "..." : "0"),
            icon: Users,
            color: "border-primary",
        },
        {
            label: "Pending Payroll",
            value: statsData?.pendingPayrolls?.toString() || (loading ? "..." : "0"),
            icon: FileCheck,
            color: "border-primary",
            action: "Generate All →",
            actionPath: "/accountant/generate-payroll",
        },
        {
            label: "Paid This Month",
            value: statsData?.paidThisMonth?.toString() || (loading ? "..." : "0"),
            icon: CheckCircle,
            color: "border-green-500",
        },
        {
            label: "Total Payout",
            value: loading ? "..." : `LKR ${((statsData?.totalPayout || 0) / 1000000).toFixed(1)}M`,
            icon: Banknote,
            color: "border-primary",
            valueClassName: "text-primary",
        },
    ];

    const quickActions = [
        {
            title: "Generate New Payroll",
            desc: "Create salary slip for officer",
            path: "/accountant/generate-payroll",
            icon: Plus,
            className: "bg-gradient-to-r from-primary to-charcoal text-primary-foreground",
        },
        {
            title: "View All Payrolls",
            desc: "Browse payroll records",
            path: "/accountant/payroll-records",
            icon: LayoutList,
        },
        {
            title: "Salary Trends",
            desc: "View analytics & charts",
            path: "/accountant/salary-trends",
            icon: TrendingUp,
        },
        {
            title: "Advance Requests",
            desc: "Manage pending & paid advances",
            path: "/accountant/advance-requests",
            icon: Clock,
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-black tracking-tight uppercase text-charcoal">Welcome back, Accountant</h2>
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">{format(new Date(), "MMMM yyyy")} Overview</p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.label} className={`border-l-4 ${stat.color} shadow-lg border-y-0 border-r-0 hover:scale-[1.02] transition-transform duration-300`}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-3xl font-black ${stat.valueClassName || "text-charcoal"}`}>{stat.value}</p>
                                        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                    </div>
                                    {stat.action && stat.actionPath && (
                                        <Link to={stat.actionPath} className="mt-3 block text-[10px] font-black text-primary hover:underline uppercase tracking-tighter">
                                            {stat.action}
                                        </Link>
                                    )}
                                </div>
                                <stat.icon className="h-8 w-8 text-muted/20" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quickActions.map((action) => (
                    <Link
                        key={action.title}
                        to={action.path}
                        className={`group p-6 rounded-2xl shadow-md hover:shadow-xl transition-all flex items-center justify-between border-2 ${action.className || "bg-card border-neutral-100 hover:border-primary/50"
                            }`}
                    >
                        <div>
                            <p className="font-black text-lg uppercase tracking-tight">{action.title}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${action.className ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {action.desc}
                            </p>
                        </div>
                        <div className={`p-2 rounded-lg ${action.className ? "bg-white/20" : "bg-primary/10 group-hover:bg-primary/20"} transition-colors`}>
                            <action.icon className={`h-5 w-5 ${action.className ? "text-white" : "text-primary"}`} />
                        </div>
                    </Link>
                ))}
            </div>

            {/* Bar chart */}
            <Card className="shadow-2xl border-none overflow-hidden rounded-3xl">
                <CardHeader className="bg-neutral-50/50 pb-2 border-b border-neutral-100">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-charcoal">Average Salary Trend</CardTitle>
                        <span className="text-[10px] font-bold text-muted-foreground bg-white px-2 py-1 rounded-md border border-neutral-100">LAST 6 MONTHS</span>
                    </div>
                </CardHeader>
                <CardContent className="pt-8 h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-charcoal text-white p-3 rounded-xl shadow-2xl border border-white/10">
                                                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50">{payload[0].payload.name}</p>
                                                <p className="text-lg font-black">{payload[0].value}% <span className="text-[10px] font-bold opacity-70">GROWTH</span></p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill="hsl(var(--primary))"
                                        fillOpacity={0.8 + (index * 0.04)}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default AccountantDashboard;
