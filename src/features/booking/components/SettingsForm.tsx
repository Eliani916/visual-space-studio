"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settingsSchema, SettingsInput } from "@/validations/settings.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { updateSettings } from "../actions/settings.actions";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsForm({ initialData }: { initialData: SettingsInput }) {
  const [loading, setLoading] = useState(false);
  
  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: SettingsInput) => {
    setLoading(true);
    const res = await updateSettings(data);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="openingHour"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jam Buka (HH:MM)</FormLabel>
                <FormControl>
                  <Input placeholder="09:00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="closingHour"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jam Tutup (HH:MM)</FormLabel>
                <FormControl>
                  <Input placeholder="21:00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="dpMinDaysAhead"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimal H- untuk Wajib DP (Hari)</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dpDeadlineHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Batas Waktu Bayar DP (Jam)</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fullPaymentDeadlineHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Batas Waktu Pelunasan (Jam)</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </form>
    </Form>
  );
}
