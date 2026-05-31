"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getLandingFeatures,
  createLandingFeature,
  updateLandingFeature,
  deleteLandingFeature,
  getLandingSteps,
  createLandingStep,
  updateLandingStep,
  deleteLandingStep,
  getLandingFaqs,
  createLandingFaq,
  updateLandingFaq,
  deleteLandingFaq,
} from "../actions/landing.actions";
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Sparkles,
  HelpCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Calendar,
  CreditCard,
  Download,
  Star,
  Camera,
  Heart,
  ShieldCheck,
} from "lucide-react";

// List of supported Lucide icons for features
const AVAILABLE_ICONS = [
  { name: "Sparkles", Icon: Sparkles },
  { name: "Calendar", Icon: Calendar },
  { name: "CreditCard", Icon: CreditCard },
  { name: "Download", Icon: Download },
  { name: "Star", Icon: Star },
  { name: "Camera", Icon: Camera },
  { name: "Heart", Icon: Heart },
  { name: "ShieldCheck", Icon: ShieldCheck },
  { name: "Clock", Icon: Clock },
];

function getIconComponent(iconName: string) {
  const found = AVAILABLE_ICONS.find((item) => item.name === iconName);
  return found ? found.Icon : Sparkles;
}

export default function LandingPageManager() {
  const [activeTab, setActiveTab] = useState<"features" | "steps" | "faqs">("features");

  return (
    <div className="p-6 space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/85 dark:border-zinc-800/85 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Manajemen Konten Landing Page
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Kustomisasi informasi Keunggulan, Cara Kerja, dan FAQ yang tampil pada halaman utama Visual Space.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 dark:bg-zinc-950/60 p-1 rounded-xl border border-slate-200/50 dark:border-zinc-800/50">
          <button
            onClick={() => setActiveTab("features")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${activeTab === "features"
                ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Keunggulan
          </button>
          <button
            onClick={() => setActiveTab("steps")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${activeTab === "steps"
                ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Cara Kerja
          </button>
          <button
            onClick={() => setActiveTab("faqs")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer ${activeTab === "faqs"
                ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            FAQ
          </button>
        </div>
      </div>

      {/* Tab Renderers */}
      <div className="transition-all duration-300">
        {activeTab === "features" && <FeatureManager />}
        {activeTab === "steps" && <StepManager />}
        {activeTab === "faqs" && <FaqManager />}
      </div>
    </div>
  );
}

// ==========================================
// FEATURE MANAGER COMPONENT
// ==========================================

function FeatureManager() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Sparkles");
  const [order, setOrder] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const res = await getLandingFeatures();
    if (res.success) {
      setData(res.data || []);
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setIcon("Sparkles");
    setOrder(data.length);
    setOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setIcon(item.icon);
    setOrder(item.order);
    setOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus keunggulan "${name}"?`)) return;
    const res = await deleteLandingFeature(id);
    if (res.success) {
      toast.success(res.message);
      loadData();
    } else {
      toast.error(res.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Judul dan Deskripsi wajib diisi");
      return;
    }

    setSaving(true);
    let res;
    if (editingId) {
      res = await updateLandingFeature(editingId, { title, description, icon, order });
    } else {
      res = await createLandingFeature({ title, description, icon, order });
    }

    if (res.success) {
      toast.success(editingId ? "Keunggulan diperbarui" : "Keunggulan baru ditambahkan");
      setOpen(false);
      loadData();
    } else {
      toast.error(res.message);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm">
        <div>
          <h3 className="text-base font-bold">Daftar Keunggulan (Features)</h3>
          <p className="text-xxs text-slate-400">Menampilkan 3 kartu keunggulan di landing page.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="h-9 cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={
              <Button onClick={handleAdd} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-9 cursor-pointer">
                <Plus className="w-4 h-4 mr-1" />
                Tambah Keunggulan
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Keunggulan" : "Tambah Keunggulan Baru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Judul Keunggulan</label>
                  <Input
                    placeholder="Contoh: Reservasi Waktu Realtime"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Deskripsi Singkat</label>
                  <textarea
                    placeholder="Tulis penjelasan singkat mengenai fitur keunggulan..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={saving}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Ikon Lucide</label>
                    <select
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={saving}
                    >
                      {AVAILABLE_ICONS.map((item) => (
                        <option key={item.name} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Urutan Tampilan</label>
                    <Input
                      type="number"
                      min="0"
                      value={order}
                      onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                      disabled={saving}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={saving} className="w-full mt-2 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white">
                  {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Baru"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border border-slate-200/85 dark:border-zinc-800/85 rounded-xl bg-white dark:bg-zinc-900 shadow-sm overflow-hidden animate-fade-in">
        <Table>
          <TableHeader className="bg-slate-50/75 dark:bg-zinc-950/20">
            <TableRow>
              <TableHead className="w-[80px]">Ikon</TableHead>
              <TableHead className="w-[200px]">Judul</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead className="w-[80px] text-center">Urutan</TableHead>
              <TableHead className="w-[100px] text-right pr-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-500 mx-auto" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                  Belum ada data keunggulan.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => {
                const IconComponent = getIconComponent(item.icon);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/30">
                        <IconComponent className="w-4 h-4" />
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-800 dark:text-zinc-200">
                      {item.title}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-zinc-400 text-xs">
                      {item.description}
                    </TableCell>
                    <TableCell className="text-center font-bold text-slate-600 dark:text-zinc-400">
                      {item.order}
                    </TableCell>
                    <TableCell className="text-right space-x-1 pr-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        className="h-8 w-8 p-0 cursor-pointer text-slate-600 dark:text-zinc-400 hover:text-indigo-600"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id, item.title)}
                        className="h-8 w-8 p-0 cursor-pointer text-red-500 hover:bg-red-50 hover:text-red-650"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ==========================================
// STEP MANAGER COMPONENT (HOW IT WORKS)
// ==========================================

function StepManager() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stepNumber, setStepNumber] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const res = await getLandingSteps();
    if (res.success) {
      setData(res.data || []);
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    setStepNumber(data.length + 1);
    setTitle("");
    setDescription("");
    setOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setStepNumber(item.stepNumber);
    setTitle(item.title);
    setDescription(item.description);
    setOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus langkah "${name}"?`)) return;
    const res = await deleteLandingStep(id);
    if (res.success) {
      toast.success(res.message);
      loadData();
    } else {
      toast.error(res.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Judul dan Deskripsi wajib diisi");
      return;
    }

    setSaving(true);
    let res;
    if (editingId) {
      res = await updateLandingStep(editingId, { stepNumber, title, description });
    } else {
      res = await createLandingStep({ stepNumber, title, description });
    }

    if (res.success) {
      toast.success(editingId ? "Langkah diperbarui" : "Langkah baru ditambahkan");
      setOpen(false);
      loadData();
    } else {
      toast.error(res.message);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm">
        <div>
          <h3 className="text-base font-bold">Alur Cara Kerja (Steps)</h3>
          <p className="text-xxs text-slate-400">Mengelola 4 langkah berurutan di landing page.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="h-9 cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={
              <Button onClick={handleAdd} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-9 cursor-pointer">
                <Plus className="w-4 h-4 mr-1" />
                Tambah Langkah
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Langkah" : "Tambah Langkah Baru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Langkah Ke-</label>
                    <Input
                      type="number"
                      min="1"
                      value={stepNumber}
                      onChange={(e) => setStepNumber(parseInt(e.target.value) || 1)}
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Judul Langkah</label>
                    <Input
                      placeholder="Contoh: Datang & Foto"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Deskripsi Detail</label>
                  <textarea
                    placeholder="Jelaskan langkah ini kepada pelanggan..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={saving}
                  />
                </div>

                <Button type="submit" disabled={saving} className="w-full mt-2 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white">
                  {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Baru"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border border-slate-200/85 dark:border-zinc-800/85 rounded-xl bg-white dark:bg-zinc-900 shadow-sm overflow-hidden animate-fade-in">
        <Table>
          <TableHeader className="bg-slate-50/75 dark:bg-zinc-950/20">
            <TableRow>
              <TableHead className="w-[100px] text-center">No. Langkah</TableHead>
              <TableHead className="w-[200px]">Judul Langkah</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead className="w-[100px] text-right pr-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-500 mx-auto" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                  Belum ada data langkah cara kerja.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm border border-indigo-100/50 dark:border-indigo-900/30">
                      {item.stepNumber}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-slate-800 dark:text-zinc-200">
                    {item.title}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-zinc-400 text-xs">
                    {item.description}
                  </TableCell>
                  <TableCell className="text-right space-x-1 pr-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="h-8 w-8 p-0 cursor-pointer text-slate-600 dark:text-zinc-400 hover:text-indigo-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id, item.title)}
                      className="h-8 w-8 p-0 cursor-pointer text-red-500 hover:bg-red-50 hover:text-red-650"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ==========================================
// FAQ MANAGER COMPONENT
// ==========================================

function FaqManager() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const res = await getLandingFaqs();
    if (res.success) {
      setData(res.data || []);
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    setQuestion("");
    setAnswer("");
    setOrder(data.length);
    setOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setQuestion(item.question);
    setAnswer(item.answer);
    setOrder(item.order);
    setOpen(true);
  };

  const handleDelete = async (id: string, q: string) => {
    if (!confirm(`Hapus FAQ "${q.substring(0, 30)}..."?`)) return;
    const res = await deleteLandingFaq(id);
    if (res.success) {
      toast.success(res.message);
      loadData();
    } else {
      toast.error(res.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      toast.error("Pertanyaan dan Jawaban wajib diisi");
      return;
    }

    setSaving(true);
    let res;
    if (editingId) {
      res = await updateLandingFaq(editingId, { question, answer, order });
    } else {
      res = await createLandingFaq({ question, answer, order });
    }

    if (res.success) {
      toast.success(editingId ? "FAQ diperbarui" : "FAQ baru ditambahkan");
      setOpen(false);
      loadData();
    } else {
      toast.error(res.message);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm">
        <div>
          <h3 className="text-base font-bold">Tanya Jawab (FAQs)</h3>
          <p className="text-xxs text-slate-400">Pertanyaan umum yang sering ditanyakan oleh pelanggan.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="h-9 cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={
              <Button onClick={handleAdd} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-9 cursor-pointer">
                <Plus className="w-4 h-4 mr-1" />
                Tambah FAQ
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit FAQ" : "Tambah FAQ Baru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Pertanyaan</label>
                  <Input
                    placeholder="Contoh: Berapa lama file foto disimpan?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Jawaban</label>
                  <textarea
                    placeholder="Tulis jawaban lengkap mengenai pertanyaan tersebut..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-28 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">Urutan Tampilan</label>
                  <Input
                    type="number"
                    min="0"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                    disabled={saving}
                  />
                </div>

                <Button type="submit" disabled={saving} className="w-full mt-2 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white">
                  {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Baru"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border border-slate-200/85 dark:border-zinc-800/85 rounded-xl bg-white dark:bg-zinc-900 shadow-sm overflow-hidden animate-fade-in">
        <Table>
          <TableHeader className="bg-slate-50/75 dark:bg-zinc-950/20">
            <TableRow>
              <TableHead className="w-[250px]">Pertanyaan</TableHead>
              <TableHead>Jawaban</TableHead>
              <TableHead className="w-[80px] text-center">Urutan</TableHead>
              <TableHead className="w-[100px] text-right pr-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-500 mx-auto" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                  Belum ada data FAQ.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-bold text-slate-800 dark:text-zinc-200 text-xs">
                    {item.question}
                  </TableCell>
                  <TableCell className="text-slate-650 dark:text-zinc-400 text-xs truncate max-w-md" title={item.answer}>
                    {item.answer}
                  </TableCell>
                  <TableCell className="text-center font-bold text-slate-600 dark:text-zinc-400">
                    {item.order}
                  </TableCell>
                  <TableCell className="text-right space-x-1 pr-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="h-8 w-8 p-0 cursor-pointer text-slate-600 dark:text-zinc-400 hover:text-indigo-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id, item.question)}
                      className="h-8 w-8 p-0 cursor-pointer text-red-500 hover:bg-red-50 hover:text-red-650"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


