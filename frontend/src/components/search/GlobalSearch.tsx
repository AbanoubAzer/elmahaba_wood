import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useCustomerSupplierStore } from '../../store/customerSupplierStore';
import { useWoodStore } from '../../store/woodStore';
import { useInvoiceStore } from '../../store/invoiceStore';

interface SearchResult {
  type: 'customer' | 'supplier' | 'invoice' | 'product';
  id: string;
  title: string;
  subtitle: string;
  route: string;
  icon: string;
}

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { customers, suppliers } = useCustomerSupplierStore();
  const { products } = useWoodStore();
  const { invoices } = useInvoiceStore();

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const q = query.toLowerCase();
    const found: SearchResult[] = [];

    customers.filter((c) =>
      c.name.includes(q) || c.phone.includes(q)
    ).slice(0, 3).forEach((c) => found.push({
      type: 'customer', id: c.id,
      title: c.name, subtitle: `📞 ${c.phone} | رصيد: ${c.balance.toLocaleString()} ج.م`,
      route: `/customers/${c.id}`, icon: '👤',
    }));

    suppliers.filter((s) =>
      s.name.includes(q) || s.phone.includes(q)
    ).slice(0, 3).forEach((s) => found.push({
      type: 'supplier', id: s.id,
      title: s.name, subtitle: `📞 ${s.phone} | رصيد: ${s.balance.toLocaleString()} ج.م`,
      route: `/suppliers/${s.id}`, icon: '🏭',
    }));

    invoices.filter((i) =>
      i.invoiceNo.toLowerCase().includes(q) || i.partyName.includes(q)
    ).slice(0, 3).forEach((i) => found.push({
      type: 'invoice', id: i.id,
      title: i.invoiceNo,
      subtitle: `${i.partyName} | ${i.totalAmount.toLocaleString()} ج.م | ${i.status === 'paid' ? '✅ مسدد' : i.status === 'partial' ? '🔸 جزئي' : '🔴 غير مسدد'}`,
      route: '/invoices', icon: '🧾',
    }));

    products.filter((p) =>
      p.name.includes(q) || p.code.toLowerCase().includes(q)
    ).slice(0, 3).forEach((p) => found.push({
      type: 'product', id: p.id,
      title: `${p.code} — ${p.name}`,
      subtitle: `رصيد المخزون: ${p.volumeM3.toFixed(4)} م³ | السعر: ${p.pricePerM3.toLocaleString()} ج.م/م³`,
      route: '/catalog', icon: '🪵',
    }));

    setResults(found);
    setOpen(found.length > 0);
  }, [query, customers, suppliers, invoices, products]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.route);
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('');
      setOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.closest('.search-container')?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus on Cmd+K
  useEffect(() => {
    const handleCmdK = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleCmdK);
    return () => document.removeEventListener('keydown', handleCmdK);
  }, []);

  return (
    <div className="search-container relative w-full max-w-sm" dir="rtl">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="بحث... (Cmd+K)"
          className="w-full pl-8 pr-10 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white transition"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 right-0 left-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-[500] overflow-hidden">
          {results.map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              onClick={() => handleSelect(r)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition text-right border-b border-slate-50 last:border-0"
            >
              <span className="text-xl mt-0.5">{r.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{r.title}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{r.subtitle}</p>
              </div>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md mt-0.5 whitespace-nowrap">
                {r.type === 'customer' ? 'عميل' : r.type === 'supplier' ? 'مورد' : r.type === 'invoice' ? 'فاتورة' : 'منتج'}
              </span>
            </button>
          ))}
          {query.length >= 2 && results.length === 0 && (
            <div className="px-4 py-6 text-center text-slate-400 text-sm">
              لا توجد نتائج لـ "<span className="font-medium text-slate-600">{query}</span>"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
