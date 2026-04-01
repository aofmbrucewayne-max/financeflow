'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Pencil, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import type { Category } from '@/lib/types';
import { useCategoryTree } from '@/lib/hooks/useCategories';
import { useThemeStore } from '@/lib/stores/themeStore';

const ICONS = [
  '🍽️','🏠','🚗','🎮','❤️','🛍️','📚','✈️','📱','📄','🏦','💼',
  '💻','📈','🎁','💰','⚡','🎵','🐾','🌿','💊','🏋️','🎨','🔧',
  '☕','🛒','🍴','🛵','🏡','💡','⛽','🚇','🅿️','🚕','🍔','🎓',
];
const COLORS = [
  '#7c3aed','#3b82f6','#22c55e','#f59e0b',
  '#ef4444','#ec4899','#06b6d4','#8b5cf6',
  '#f97316','#14b8a6','#64748b','#a78bfa',
];

// ── Modal ──────────────────────────────────────────────────────────────────
function CategoryModal({
  isOpen, onClose, editingId, defaultType = 'expense', defaultParentId = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingId?: string | null;
  defaultType?: 'income' | 'expense';
  defaultParentId?: string | null;
}) {
  const c = useThemeStore((s) => s.colors);
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>(defaultType);
  const [icon, setIcon] = useState('💰');
  const [color, setColor] = useState('#7c3aed');
  const [parentId, setParentId] = useState<string | null>(defaultParentId);
  const [isSaving, setIsSaving] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: c.bgTertiary,
    border: `1px solid ${c.borderDefault}`,
    color: c.textPrimary,
    borderRadius: '12px',
    padding: '10px 12px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const parentCategories = useLiveQuery(
    () => db.categories.filter(cat => !cat.isArchived && cat.parentId === null && cat.type === type).toArray(),
    [type],
  );

  // Load data when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (editingId) {
      db.categories.get(editingId).then((cat) => {
        if (!cat) return;
        setName(cat.name);
        setType(cat.type);
        setIcon(cat.icon);
        setColor(cat.color);
        setParentId(cat.parentId);
      });
    } else {
      setName('');
      setType(defaultType);
      setIcon('💰');
      setColor('#7c3aed');
      setParentId(defaultParentId);
    }
  }, [isOpen, editingId, defaultType, defaultParentId]);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Category name required'); return; }
    setIsSaving(true);
    try {
      if (editingId) {
        await db.categories.update(editingId, { name: name.trim(), icon, color, type, parentId });
        toast.success('Category updated');
      } else {
        const catData: Category = {
          id: uuidv4(), name: name.trim(), type, icon, color,
          parentId, isCustom: true, sortOrder: 99, isArchived: false,
        };
        await db.categories.add(catData);
        toast.success('Category created');
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-md sm:mx-4 sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: c.bgSecondary, border: `1px solid ${c.borderDefault}`, maxHeight: '90dvh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: c.borderHover }} />
        </div>

        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${c.borderDefault}` }}>
          <h2 className="text-base font-semibold" style={{ color: c.textPrimary }}>
            {editingId ? 'Edit Category' : 'New Category'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: c.textSecondary }}>✕</button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90dvh - 120px)' }}>
          {/* Type toggle */}
          <div className="flex rounded-xl p-1 gap-1" style={{ backgroundColor: c.bgPrimary }}>
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setType(t); setParentId(null); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-all"
                style={type === t
                  ? { backgroundColor: t === 'income' ? '#22c55e20' : '#ef444420', color: t === 'income' ? '#22c55e' : '#ef4444', border: `1px solid ${t === 'income' ? '#22c55e' : '#ef4444'}44` }
                  : { color: c.textSecondary }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: c.textSecondary }}>Name</label>
            <input
              type="text"
              placeholder="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = c.accent; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = c.borderDefault; }}
            />
          </div>

          {/* Parent */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: c.textSecondary }}>Parent Category (optional)</label>
            <select
              value={parentId ?? ''}
              onChange={(e) => setParentId(e.target.value || null)}
              style={inputStyle}
            >
              <option value="">None (top-level)</option>
              {parentCategories?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: c.textSecondary }}>Icon</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all"
                  style={icon === i
                    ? { backgroundColor: c.accent + '30', border: `2px solid ${c.accent}` }
                    : { backgroundColor: c.bgTertiary, border: '2px solid transparent' }}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: c.textSecondary }}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((ch) => (
                <button
                  key={ch}
                  onClick={() => setColor(ch)}
                  className="w-8 h-8 rounded-lg transition-all"
                  style={{ backgroundColor: ch, outline: color === ch ? `2px solid ${ch}` : 'none', outlineOffset: '2px' }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4" style={{ borderTop: `1px solid ${c.borderDefault}` }}>
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-medium"
            style={{ backgroundColor: c.bgTertiary, color: c.textSecondary, border: `1px solid ${c.borderDefault}` }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving}
            className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${c.accent}, #3b82f6)`, color: '#fff' }}>
            {isSaving ? 'Saving…' : editingId ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Category Row ───────────────────────────────────────────────────────────
function CategoryItem({
  cat,
  onEdit,
  onArchive,
}: {
  cat: { id: string; name: string; icon: string; color: string; children: Category[] };
  onEdit: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const c = useThemeStore((s) => s.colors);
  const [open, setOpen] = useState(false);
  const hasChildren = cat.children.length > 0;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: c.bgSecondary, border: `1px solid ${c.borderDefault}` }}>
      {/* Parent row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: cat.color + '20' }}>
          {cat.icon}
        </div>

        {/* Name + subcount */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: c.textPrimary }}>{cat.name}</p>
          {hasChildren && (
            <p className="text-xs" style={{ color: c.textTertiary }}>
              {cat.children.length} subcategor{cat.children.length === 1 ? 'y' : 'ies'}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(cat.id)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: c.textPrimary, backgroundColor: c.bgElevated }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = c.borderDefault; (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = c.bgElevated; (e.currentTarget as HTMLElement).style.color = c.textPrimary; }}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onArchive(cat.id)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#f87171', backgroundColor: '#ef444418' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ef444430'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ef444418'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {hasChildren && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="p-2 rounded-lg transition-colors ml-1"
              style={{ color: open ? c.accent : c.textSecondary, backgroundColor: open ? c.accent + '15' : 'transparent' }}
            >
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Subcategories — collapsible */}
      {hasChildren && open && (
        <div style={{ borderTop: `1px solid ${c.borderDefault}` }}>
          {cat.children.map((child, idx) => (
            <div
              key={child.id}
              className="flex items-center gap-3 px-4 py-2.5"
              style={{
                backgroundColor: c.bgPrimary,
                borderTop: idx > 0 ? `1px solid ${c.borderDefault}` : undefined,
              }}
            >
              {/* Indent line */}
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <div className="w-px h-4 rounded" style={{ backgroundColor: c.borderDefault }} />
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: child.color + '20' }}>
                  {child.icon}
                </div>
              </div>

              <p className="flex-1 text-sm font-medium truncate" style={{ color: c.textPrimary }}>{child.name}</p>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onEdit(child.id)}
                  className="p-2 md:p-1.5 rounded-lg transition-colors"
                  style={{ color: c.textPrimary, backgroundColor: c.bgTertiary }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = c.bgElevated; (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = c.bgTertiary; (e.currentTarget as HTMLElement).style.color = c.textPrimary; }}
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onArchive(child.id)}
                  className="p-2 md:p-1.5 rounded-lg transition-colors"
                  style={{ color: '#f87171', backgroundColor: '#ef444418' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ef444430'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ef444418'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const c = useThemeStore((s) => s.colors);
  const [tab, setTab] = useState<'expense' | 'income'>('expense');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);

  const tree = useCategoryTree(tab);

  const openNew = (parentId: string | null = null) => {
    setEditingId(null);
    setDefaultParentId(parentId);
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setDefaultParentId(null);
    setModalOpen(true);
  };

  const handleArchive = async (id: string) => {
    if (confirm('Archive this category? It will be hidden but data is kept.')) {
      await db.categories.update(id, { isArchived: true });
      toast.success('Category archived');
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: c.textPrimary }}>Categories</h1>
          <p className="text-sm mt-0.5" style={{ color: c.textSecondary }}>
            {tree?.length ?? 0} {tab} categories
          </p>
        </div>
        <button
          onClick={() => openNew(null)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: `linear-gradient(135deg, ${c.accent}, #3b82f6)`, color: '#fff' }}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Category</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['expense', 'income'] as const).map((t) => {
          const ch = t === 'income' ? '#22c55e' : '#ef4444';
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all"
              style={tab === t
                ? { backgroundColor: ch + '20', color: ch, border: `1px solid ${ch}44` }
                : { backgroundColor: c.bgSecondary, color: c.textSecondary, border: `1px solid ${c.borderDefault}` }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* List */}
      {tree === undefined ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: c.accent, borderTopColor: 'transparent' }} />
        </div>
      ) : tree.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={{ backgroundColor: c.bgSecondary, border: `1px solid ${c.borderDefault}` }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3" style={{ backgroundColor: c.bgTertiary }}>🏷️</div>
          <p className="text-sm font-medium" style={{ color: c.textPrimary }}>No {tab} categories</p>
          <button onClick={() => openNew(null)} className="mt-4 px-4 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: c.accent, color: '#fff' }}>
            Create one
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {tree.map((cat) => (
            <CategoryItem
              key={cat.id}
              cat={cat}
              onEdit={openEdit}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}

      <CategoryModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingId(null); setDefaultParentId(null); }}
        editingId={editingId}
        defaultType={tab}
        defaultParentId={defaultParentId}
      />
    </div>
  );
}
