'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Pencil, ChevronRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import type { Category } from '@/lib/types';
import { useCategoryTree } from '@/lib/hooks/useCategories';

const ICONS = ['🍽️', '🏠', '🚗', '🎮', '❤️', '🛍️', '📚', '✈️', '📱', '📄', '🏦', '💼', '💻', '📈', '🎁', '💰', '⚡', '🎵', '🐾', '🌿', '💊', '🏋️', '🎨', '🔧'];
const COLORS = ['#7c3aed', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6', '#f97316', '#14b8a6', '#64748b', '#a78bfa'];

interface CategoryFormModal {
  isOpen: boolean;
  onClose: () => void;
  editingId?: string | null;
  defaultType?: 'income' | 'expense';
  defaultParentId?: string | null;
}

function CategoryFormModal({ isOpen, onClose, editingId, defaultType = 'expense', defaultParentId = null }: CategoryFormModal) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>(defaultType);
  const [icon, setIcon] = useState('💰');
  const [color, setColor] = useState('#7c3aed');
  const [parentId, setParentId] = useState<string | null>(defaultParentId);
  const [isSaving, setIsSaving] = useState(false);

  const parentCategories = useLiveQuery(() =>
    db.categories.filter(item => !item.isArchived).toArray().then(cats => cats.filter(c => c.parentId === null && c.type === type)),
  [type]);

  useState(() => {
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
  });

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Category name required'); return; }
    setIsSaving(true);
    try {
      const catData: Category = {
        id: editingId ?? uuidv4(),
        name: name.trim(),
        type,
        icon,
        color,
        parentId,
        isCustom: true,
        sortOrder: 99,
        isArchived: false,
      };
      if (editingId) {
        await db.categories.put(catData);
        toast.success('Category updated');
      } else {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl" style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #2a2a40' }}>
          <h2 className="text-base font-semibold" style={{ color: '#e8e8f0' }}>
            {editingId ? 'Edit Category' : 'New Category'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: '#8888a0' }}>✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Type */}
          <div className="flex rounded-xl p-1" style={{ backgroundColor: '#0a0a0f' }}>
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className="flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all"
                style={type === t
                  ? { backgroundColor: t === 'income' ? '#22c55e20' : '#ef444420', color: t === 'income' ? '#22c55e' : '#ef4444' }
                  : { color: '#8888a0' }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>Name</label>
            <input
              type="text"
              placeholder="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a40', color: '#e8e8f0' }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = '#7c3aed'; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = '#2a2a40'; }}
            />
          </div>

          {/* Parent */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>Parent Category (optional)</label>
            <select
              value={parentId ?? ''}
              onChange={(e) => setParentId(e.target.value || null)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a40', color: '#e8e8f0' }}
            >
              <option value="">None (top-level)</option>
              {parentCategories?.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>Icon</label>
            <div className="flex gap-1.5 flex-wrap">
              {ICONS.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className="w-9 h-9 rounded-lg text-lg flex items-center justify-center"
                  style={icon === i ? { backgroundColor: '#7c3aed30', border: '2px solid #7c3aed' } : { backgroundColor: '#1a1a2e', border: '2px solid transparent' }}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-lg"
                  style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #2a2a40' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: '#1a1a2e', color: '#8888a0', border: '1px solid #2a2a40' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}
          >
            {isSaving ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const [tab, setTab] = useState<'expense' | 'income'>('expense');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const tree = useCategoryTree(tab);

  const openEdit = (id: string) => { setEditingId(id); setModalOpen(true); };

  const handleArchive = async (id: string) => {
    if (confirm('Archive this category?')) {
      await db.categories.update(id, { isArchived: true });
      toast.success('Category archived');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e8e8f0' }}>Categories</h1>
          <p className="text-sm mt-0.5" style={{ color: '#8888a0' }}>Organize your transactions</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#6d28d9'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#7c3aed'; }}
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all"
            style={tab === t
              ? { backgroundColor: t === 'income' ? '#22c55e20' : '#ef444420', color: t === 'income' ? '#22c55e' : '#ef4444', border: `1px solid ${t === 'income' ? '#22c55e' : '#ef4444'}40` }
              : { backgroundColor: '#12121a', color: '#8888a0', border: '1px solid #2a2a40' }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tree */}
      {tree === undefined ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#7c3aed', borderTopColor: 'transparent' }} />
        </div>
      ) : tree.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3" style={{ backgroundColor: '#1a1a2e' }}>
            🏷️
          </div>
          <p className="text-sm font-medium" style={{ color: '#e8e8f0' }}>No {tab} categories</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tree.map((cat) => (
            <div key={cat.id} className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}>
              {/* Parent */}
              <div className="flex items-center gap-3 px-4 py-3 group">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                  {cat.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>{cat.name}</p>
                  {cat.children.length > 0 && (
                    <p className="text-xs" style={{ color: '#555570' }}>{cat.children.length} subcategories</p>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(cat.id)} className="p-1.5 rounded-lg" style={{ color: '#8888a0' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#22223a'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {/* Children */}
              {cat.children.map((child, idx) => (
                <div
                  key={child.id}
                  className="flex items-center gap-3 px-4 py-2.5 group ml-8"
                  style={{
                    borderTop: '1px solid #2a2a40',
                    backgroundColor: '#0a0a0f',
                  }}
                >
                  <ChevronRight className="w-3 h-3 shrink-0" style={{ color: '#555570' }} />
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: child.color + '20' }}>
                    {child.icon}
                  </div>
                  <p className="flex-1 text-sm" style={{ color: '#8888a0' }}>{child.name}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(child.id)} className="p-1.5 rounded-lg" style={{ color: '#8888a0' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#22223a'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <CategoryFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingId(null); }}
        editingId={editingId}
        defaultType={tab}
      />
    </div>
  );
}
