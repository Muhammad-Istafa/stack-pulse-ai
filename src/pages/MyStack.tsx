import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const CATEGORIES = ["AI/ML", "Cloud Infrastructure", "Database", "SaaS Tool", "API Service"] as const;

type Tool = { id: string; tool_name: string; category: string; monthly_cost: number; created_at: string };

const schema = z.object({
  tool_name: z.string().trim().min(1).max(80),
  category: z.enum(CATEGORIES),
  monthly_cost: z.number().min(0).max(1000000),
});

export default function MyStack() {
  const { user } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tool | null>(null);
  const [form, setForm] = useState({ tool_name: "", category: "AI/ML", monthly_cost: 0 });

  useEffect(() => { document.title = "My Stack · Stack Sentinel"; }, []);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("stack_tools").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setTools((data as Tool[]) ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const total = tools.reduce((s, t) => s + Number(t.monthly_cost || 0), 0);

  const openAdd = () => { setEditing(null); setForm({ tool_name: "", category: "AI/ML", monthly_cost: 0 }); setOpen(true); };
  const openEdit = (t: Tool) => { setEditing(t); setForm({ tool_name: t.tool_name, category: t.category, monthly_cost: Number(t.monthly_cost) }); setOpen(true); };

  const save = async () => {
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error("Invalid input"); return; }
    if (editing) {
      const { error } = await supabase.from("stack_tools").update(parsed.data).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Updated");
    } else {
      const { error } = await supabase.from("stack_tools").insert([{ ...parsed.data, user_id: user.id }]);
      if (error) return toast.error(error.message);
      toast.success("Added");
    }
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("stack_tools").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">My Stack</h1>
            <p className="text-sm text-muted-foreground">Manage the tools we monitor for you.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAdd} className="gap-1"><Plus className="h-4 w-4" /> Add Tool</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit tool" : "Add tool"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Tool name</Label><Input value={form.tool_name} onChange={(e) => setForm({ ...form, tool_name: e.target.value })} /></div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Monthly cost ($)</Label><Input type="number" min="0" value={form.monthly_cost} onChange={(e) => setForm({ ...form, monthly_cost: Number(e.target.value) })} /></div>
              </div>
              <DialogFooter><Button onClick={save}>{editing ? "Save" : "Add"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-6 shadow-card bg-priority border-primary/30">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total monthly spend</p>
          <p className="text-4xl font-semibold tabular-nums mt-1">${total.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{tools.length} tools tracked</p>
        </Card>

        <Card className="shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Monthly Cost</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tools.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.tool_name}</TableCell>
                  <TableCell><span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{t.category}</span></TableCell>
                  <TableCell className="text-right tabular-nums">${Number(t.monthly_cost).toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(t.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {tools.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No tools yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppLayout>
  );
}
