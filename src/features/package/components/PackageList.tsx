"use client";

import { useEffect, useState } from "react";
import { getPackages, deletePackage } from "../actions/package.actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
import PackageForm from "./PackageForm";

export default function PackageList() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<any>(null);

  const fetchPackages = async () => {
    setLoading(true);
    const res = await getPackages(true);
    if (res.success) {
      setPackages(res.data || []);
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus paket ini?")) return;
    const res = await deletePackage(id);
    if (res.success) {
      toast.success("Paket berhasil dihapus");
      fetchPackages();
    } else {
      toast.error(res.message);
    }
  };

  const handleEdit = (pkg: any) => {
    setEditingPkg(pkg);
    setOpen(true);
  };

  const handleAdd = () => {
    setEditingPkg(null);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manajemen Paket Foto</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={handleAdd}>Tambah Paket</Button>} />
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPkg ? "Edit Paket" : "Tambah Paket"}</DialogTitle>
            </DialogHeader>
            <PackageForm 
              initialData={editingPkg} 
              onSuccess={() => {
                setOpen(false);
                fetchPackages();
              }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Paket</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Jml Cetak</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : packages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Belum ada paket.</TableCell>
              </TableRow>
            ) : (
              packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">{pkg.name}</TableCell>
                  <TableCell>Rp {parseFloat(pkg.price).toLocaleString('id-ID')}</TableCell>
                  <TableCell>{pkg.printCount}</TableCell>
                  <TableCell>{pkg.isActive ? "Aktif" : "Nonaktif"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(pkg)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(pkg.id)}>Hapus</Button>
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
