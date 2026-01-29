'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, 
    Edit2, 
    Trash2, 
    CheckCircle2, 
    Clock, 
    AlertTriangle, 
    ChevronRight,
    ArrowLeft,
    Save,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUserReports, updateFieldReport, deleteFieldReport } from '@/app/actions/field-report';
import { toast } from 'sonner';

interface Report {
    id: string;
    product_name: string;
    agreement_rating: number;
    comment: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export function ProfileReportsView({ onBack }: { onBack: () => void }) {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<{ rating: number; comment: string }>({ rating: 0, comment: '' });

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        const res = await getUserReports();
        if (res.success) {
            setReports(res.reports);
        } else {
            toast.error(res.error || "Failed to load reports");
        }
        setLoading(false);
    };

    const handleEdit = (report: Report) => {
        setEditingId(report.id);
        setEditData({ rating: report.agreement_rating, comment: report.comment || '' });
    };

    const handleUpdate = async (id: string) => {
        const res = await updateFieldReport(id, { 
            agreementRating: editData.rating, 
            comment: editData.comment 
        });
        if (res.success) {
            toast.success("Report updated successfully");
            setEditingId(null);
            fetchReports();
        } else {
            toast.error(res.error || "Failed to update report");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this report? This action cannot be undone.")) return;
        
        const res = await deleteFieldReport(id);
        if (res.success) {
            toast.success("Report deleted");
            fetchReports();
        } else {
            toast.error(res.error || "Failed to delete report");
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'rejected': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
            default: return <Clock className="w-4 h-4 text-amber-500" />;
        }
    };

    const getVerdictLabel = (rating: number) => {
        if (rating === 1) return { label: "VERIFIED", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
        if (rating === -1) return { label: "DISPUTED", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" };
        return { label: "NEUTRAL", color: "text-slate-400 bg-slate-400/10 border-slate-400/20" };
    };

    return (
        <div className="min-h-[80vh] max-w-4xl mx-auto px-6 py-12">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
                    <div className="space-y-2">
                        <button 
                            onClick={onBack}
                            className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-primary transition-colors group mb-4"
                        >
                            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                            BACK_TO_SEARCH
                        </button>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-foreground">
                            My <span className="text-primary">Field Reports</span>
                        </h1>
                        <p className="text-sm font-mono text-muted-foreground max-w-md">
                            Manage your intelligence submissions. Authenticated data points contributing to the global analysis engine.
                        </p>
                    </div>
                </div>

                {/* Reports List */}
                <div className="grid gap-4">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-32 rounded-2xl bg-muted/20 animate-pulse border border-border" />
                        ))
                    ) : reports.length === 0 ? (
                        <div className="text-center py-20 rounded-3xl border border-dashed border-white/10 bg-muted/5">
                            <FileText className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                            <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">No reports found in your database.</p>
                            <Button variant="link" onClick={onBack} className="mt-2 text-primary font-bold">Start Scanning →</Button>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {reports.map((report) => (
                                <motion.div
                                    key={report.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group relative overflow-hidden rounded-2xl border border-white/5 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/20 transition-all"
                                >
                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Status Badge */}
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest border ${getVerdictLabel(report.agreement_rating).color}`}>
                                                        {getVerdictLabel(report.agreement_rating).label}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground uppercase">
                                                        {getStatusIcon(report.status)}
                                                        {report.status}
                                                    </div>
                                                </div>
                                                <div className="text-[10px] font-mono text-muted-foreground opacity-50">
                                                    ID: {report.id.split('-')[0]} // {new Date(report.created_at).toLocaleDateString()}
                                                </div>
                                            </div>

                                            {editingId === report.id ? (
                                                <div className="space-y-4 pt-2">
                                                    <h3 className="text-xl font-bold text-foreground uppercase">{report.product_name}</h3>
                                                    <div className="flex gap-2">
                                                        {[-1, 0, 1].map((r) => (
                                                            <button
                                                                key={r}
                                                                onClick={() => setEditData({ ...editData, rating: r })}
                                                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                                                                    editData.rating === r 
                                                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                                                                    : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted/60'
                                                                }`}
                                                            >
                                                                {r === 1 ? 'Verify' : r === -1 ? 'Dispute' : 'Neutral'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <textarea 
                                                        value={editData.comment}
                                                        onChange={(e) => setEditData({ ...editData, comment: e.target.value })}
                                                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-foreground focus:ring-1 ring-primary/50 outline-none min-h-[100px] font-mono"
                                                        placeholder="Update your intelligence findings..."
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button size="sm" onClick={() => handleUpdate(report.id)} className="gap-2 font-bold uppercase tracking-wider text-[10px]">
                                                            <Save className="w-3 h-3" /> Commit Changes
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="gap-2 font-bold uppercase tracking-wider text-[10px]">
                                                            <X className="w-3 h-3" /> Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">
                                                        {report.product_name}
                                                    </h3>
                                                    {report.comment && (
                                                        <p className="text-sm text-muted-foreground leading-relaxed font-mono">
                                                            "{report.comment}"
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {editingId !== report.id && (
                                            <div className="flex md:flex-col items-center justify-end gap-2 border-l border-white/5 pl-6 md:min-w-[120px]">
                                                <button 
                                                    onClick={() => handleEdit(report)}
                                                    className="p-2.5 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all group/icon"
                                                    title="Edit Intelligence"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(report.id)}
                                                    className="p-2.5 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all"
                                                    title="Purge Evidence"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Glass decor */}
                                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                        <FileText className="w-16 h-16 rotate-12" />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
