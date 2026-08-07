import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Plus, Trash2, Save, ArrowRight, Calculator, CreditCard, Package, Loader2 } from 'lucide-react';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useWoodStore } from '../../store/woodStore';
import { useCustomerSupplierStore } from '../../store/customerSupplierStore';
import { useTreasuryStore } from '../../store/treasuryStore';
import { useAuthStore } from '../../store/authStore';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import type { InvoiceItem, PaymentMethod } from '../../types';
import { formatArabicNumber, toArabicDigits } from '../../utils/numberUtils';

interface PaymentSplit {
  method: PaymentMethod;
  amount: number;
  treasuryId: string;
}

export const NewInvoice: React.FC = () => {
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') === 'purchase' ? 'purchase' : 'sale';
  const preselectedPartyId = searchParams.get('partyId');
  const navigate = useNavigate();

  const { createInvoice } = useInvoiceStore();
  const { products, addProduct } = useWoodStore();
  const { customers, suppliers } = useCustomerSupplierStore();
  const { treasuries, updateBalance } = useTreasuryStore();
  const { currentUser } = useAuthStore();

  const [invoiceType, setInvoiceType] = useState<'sale' | 'purchase'>(defaultType);
  const [partyId, setPartyId] = useState(
    preselectedPartyId || (defaultType === 'sale' ? customers[0]?.id || '' : suppliers[0]?.id || '')
  );
  const [notes, setNotes] = useState('');

  // Multi-Payment Splits State
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([
    {
      method: 'cash',
      amount: 0,
      treasuryId: treasuries[0]?.id || 't1',
    },
  ]);

  // Inline New Product State
  const [inlineNewProductIndex, setInlineNewProductIndex] = useState<number | null>(null);
  const [newProductFullTitle, setNewProductFullTitle] = useState('');
  const [newProductVolumeM3, setNewProductVolumeM3] = useState(0);
  const [newProductPricePerM3, setNewProductPricePerM3] = useState(14500);
  const [newProductNotes, setNewProductNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      productId: products[0]?.id || '',
      productCode: products[0]?.code || '',
      productName: products[0]?.name || '',
      volumeM3: 1.0000,
      pricePerM3: products[0]?.pricePerM3 || 0,
      total: products[0]?.pricePerM3 || 0,
    },
  ]);

  const totalVolumeM3 = items.reduce((acc, i) => acc + i.volumeM3, 0);
  const totalAmount = items.reduce((acc, i) => acc + i.total, 0);

  const totalPaidFromSplits = paymentSplits.reduce((sum, p) => sum + (p.amount || 0), 0);
  const finalPaid = totalPaidFromSplits;
  const remainingAmount = Math.max(0, totalAmount - finalPaid);

  const handleAddPaymentSplit = () => {
    const remaining = Math.max(0, totalAmount - totalPaidFromSplits);
    setPaymentSplits([
      ...paymentSplits,
      {
        method: 'instapay',
        amount: remaining,
        treasuryId: treasuries[0]?.id || 't1',
      },
    ]);
  };

  const handleRemovePaymentSplit = (index: number) => {
    if (paymentSplits.length === 1) return;
    const updated = paymentSplits.filter((_, i) => i !== index);
    setPaymentSplits(updated);
  };

  const handlePaymentSplitChange = (index: number, field: keyof PaymentSplit, value: any) => {
    const updated = [...paymentSplits];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setPaymentSplits(updated);
  };

  const handleProductChange = (index: number, productId: string) => {
    if (productId === 'NEW_PRODUCT') {
      setInlineNewProductIndex(index);
      setNewProductFullTitle('');
      setNewProductVolumeM3(0);
      setNewProductPricePerM3(14500);
      setNewProductNotes('');

      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        productId: 'NEW_PRODUCT',
        productName: 'صنف جديد...',
        pricePerM3: 0,
        total: 0,
      };
      setItems(newItems);
      return;
    }

    setInlineNewProductIndex(null);
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const newItems = [...items];
    const vol = newItems[index].volumeM3 || 1.0;
    const itemTotal = vol * prod.pricePerM3;
    newItems[index] = {
      productId: prod.id,
      productCode: prod.code,
      productName: `${prod.code} | ${prod.name} (${prod.specs})`,
      volumeM3: vol,
      pricePerM3: prod.pricePerM3,
      total: itemTotal,
    };
    setItems(newItems);
  };

  const handleInlineNewProductSave = (targetIdx: number) => {
    if (!newProductFullTitle.trim()) return;

    const parts = newProductFullTitle.split('|').map((p) => p.trim());
    const code = parts[0] || `WOOD-${Date.now().toString().slice(-4)}`;
    const name = parts[1] || newProductFullTitle;
    const specs = parts[2] || '';

    const newProdId = 'p_' + Date.now();
    addProduct({
      code,
      name,
      specs,
      volumeM3: newProductVolumeM3 || 0,
      pricePerM3: newProductPricePerM3 || 0,
      minStockM3: 5,
      notes: newProductNotes || 'صنف مضاف أثناء إنشاء فاتورة',
    });

    const newItems = [...items];
    const vol = newItems[targetIdx]?.volumeM3 || 1.0;
    newItems[targetIdx] = {
      productId: newProdId,
      productCode: code,
      productName: `${code} | ${name} (${specs})`,
      volumeM3: vol,
      pricePerM3: newProductPricePerM3,
      total: vol * newProductPricePerM3,
    };
    setItems(newItems);
    setInlineNewProductIndex(null);
    setNewProductFullTitle('');
    setNewProductVolumeM3(0);
    setNewProductNotes('');
  };

  const handleVolumeChange = (index: number, vol: number) => {
    const newItems = [...items];
    const item = newItems[index];
    const formattedVol = Number(vol.toFixed(4));
    newItems[index] = {
      ...item,
      volumeM3: formattedVol,
      total: formattedVol * item.pricePerM3,
    };
    setItems(newItems);
  };

  const handlePriceChange = (index: number, price: number) => {
    const newItems = [...items];
    const item = newItems[index];
    newItems[index] = {
      ...item,
      pricePerM3: price,
      total: item.volumeM3 * price,
    };
    setItems(newItems);
  };

  const addItemRow = () => {
    const p = products[0];
    if (!p) return;
    setItems([
      ...items,
      {
        productId: p.id,
        productCode: p.code,
        productName: `${p.code} | ${p.name} (${p.specs})`,
        volumeM3: 1.0000,
        pricePerM3: p.pricePerM3,
        total: p.pricePerM3,
      },
    ]);
  };
  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some((i) => !i.productId || i.productId === 'NEW_PRODUCT')) {
      toast.error('يرجى تحديد جميع الأصناف في الفاتورة أو حفظ الصنف الجديد أولاً');
      return;
    }
    if (items.some((i) => i.volumeM3 <= 0)) {
      toast.error('يجب أن تكون الكمية أكبر من صفر');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedParty =
        invoiceType === 'sale'
          ? customers.find((c) => c.id === partyId)
          : suppliers.find((s) => s.id === partyId);

      if (!selectedParty) {
        setIsSubmitting(false);
        return;
      }

      const paymentSummaryText = paymentSplits
        .filter((p) => p.amount > 0)
        .map((p) => {
          const label =
            p.method === 'cash'
              ? 'كاش'
              : p.method === 'instapay'
                ? 'انستا باي'
                : p.method === 'bank_transfer'
                  ? 'تحويل بنكي'
                  : p.method === 'vodafone_cash'
                    ? 'محفظة'
                    : 'شيك';
          return `${label}: ${formatArabicNumber(p.amount, 0)} ج.م`;
        })
        .join(' + ');

      const combinedNotes = [
        notes,
        paymentSummaryText ? `وسائل السداد: ${paymentSummaryText}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      await createInvoice(
        {
          date: new Date().toISOString().split('T')[0],
          type: invoiceType,
          partyType: invoiceType === 'sale' ? 'customer' : 'supplier',
          partyId: selectedParty.id,
          partyName: selectedParty.name,
          items,
          totalVolumeM3: Number(totalVolumeM3.toFixed(4)),
          totalAmount,
          paidAmount: finalPaid,
          remainingAmount,
          paymentType: finalPaid >= totalAmount ? 'cash' : finalPaid <= 0 ? 'credit' : 'partial',
          paymentMethod: paymentSplits[0]?.method || 'cash',
          treasuryId: paymentSplits[0]?.treasuryId || treasuries[0]?.id || 't1',
          notes: combinedNotes,
          createdBy: currentUser?.name || 'محاسب عام',
        },
        currentUser?.name || 'محاسب عام',
        currentUser?.role || 'accountant'
      );

      paymentSplits.slice(1).forEach((split) => {
        if (split.amount > 0) {
          updateBalance(split.treasuryId, split.amount, invoiceType === 'sale' ? 'deposit' : 'withdrawal');
        }
      });

      toast.success('تم حفظ الفاتورة بنجاح!');
      navigate(`/invoices`);
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ الفاتورة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-xl"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#f28913]" />
              <span>إصدار فاتورة أخشاب جديدة</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">تسجيل فاتورة مبيعات أو شراء أخشاب مع إمكانية تقسيم طرق الدفع.</p>
          </div>
        </div>

        <div className="flex items-center bg-slate-200/80 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setInvoiceType('sale');
              setPartyId(customers[0]?.id || '');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${invoiceType === 'sale'
                ? 'bg-[#f28913] text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-700 hover:text-slate-900'
              }`}
          >
            فاتورة مبيعات
          </button>
          <button
            type="button"
            onClick={() => {
              setInvoiceType('purchase');
              setPartyId(suppliers[0]?.id || '');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${invoiceType === 'purchase'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-700 hover:text-slate-900'
              }`}
          >
            فاتورة شراء / توريد
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#f28913]" />
            <span>بيانات الفاتورة والطرف الرئيسي</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {invoiceType === 'sale' ? 'اختر العميل / الورشة' : 'اختر المورد / شركة الاستيراد'}
              </label>
              <Select
                value={{
                  value: partyId,
                  label: invoiceType === 'sale'
                    ? customers.find(c => c.id === partyId)?.name
                    : suppliers.find(s => s.id === partyId)?.name
                }}
                onChange={(option: any) => setPartyId(option.value)}
                options={invoiceType === 'sale'
                  ? customers.map((c) => ({
                    value: c.id,
                    label: currentUser?.role === 'admin' 
                      ? `${c.name} (الرصيد: ${formatArabicNumber(c.balance, 0)} ج.م)`
                      : c.name,
                  }))
                  : suppliers.map((s) => ({
                    value: s.id,
                    label: currentUser?.role === 'admin'
                      ? `${s.name} (المستحق له: ${formatArabicNumber(s.balance, 0)} ج.م)`
                      : s.name,
                  }))
                }
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: '0.75rem',
                    borderColor: '#e2e8f0',
                    padding: '2px',
                    fontWeight: 'bold',
                    fontFamily: 'inherit',
                  })
                }}
                placeholder="ابحث بالاسم..."
                isSearchable
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#131b2f] via-slate-900 to-[#1e293b] text-white p-6 rounded-3xl shadow-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#f28913]" />
              <span>تفاصيل المدفوعات وتوزيع طرق السداد</span>
            </h3>
            <button
              type="button"
              onClick={handleAddPaymentSplit}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-3 py-1.5 rounded-xl font-bold transition-all text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة طريقة دفع أخرى</span>
            </button>
          </div>

          <div className="space-y-3">
            {paymentSplits.map((split, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end bg-slate-800/70 p-3 rounded-2xl border border-slate-700">
                <div>
                  <label className="block font-extrabold text-slate-300 mb-1 text-[11px]">
                    وسيلة السداد ({toArabicDigits(idx + 1)}):
                  </label>
                  <select
                    value={split.method}
                    onChange={(e) => handlePaymentSplitChange(idx, 'method', e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white text-xs"
                  >
                    <option value="cash">💵 نقداً (درج الكاش الرئيسي)</option>
                    <option value="instapay">⚡ تطبيق انستا باي (InstaPay)</option>
                    <option value="bank_transfer">🏦 تحويل بنكي مباشر</option>
                    <option value="vodafone_cash">📱 محفظة فودافون كاش التجارية</option>
                    <option value="check">📄 شيك بنكي مقبول الدفع</option>
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-300 mb-1 text-[11px]">
                    المبلغ المسدد بهذا الخيار (ج.م):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={split.amount || ''}
                    onChange={(e) => handlePaymentSplitChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-emerald-400 text-xs focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="grow">
                    <label className="block font-extrabold text-slate-300 mb-1 text-[11px]">
                      الخزانة المرتبطة:
                    </label>
                    <select
                      value={split.treasuryId}
                      onChange={(e) => handlePaymentSplitChange(idx, 'treasuryId', e.target.value)}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white text-xs"
                    >
                      {treasuries.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {paymentSplits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePaymentSplit(idx)}
                      className="text-rose-400 hover:text-rose-300 p-2 font-bold shrink-0"
                      title="إزالة طريقة السداد"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-bold">
            <div>
              <span className="text-slate-400">مجموع المبالغ المسددة: </span>
              <strong className="text-emerald-400 text-sm">{formatArabicNumber(finalPaid, 0)} ج.م</strong>
            </div>
            <div>
              <span className="text-slate-400">الباقي آجل بكشف الحساب: </span>
              <strong className="text-rose-400 text-sm">{formatArabicNumber(remainingAmount, 0)} ج.م</strong>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm">بنود الأخشاب والكميات بالـ m³</h3>
            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center gap-1 bg-[#f28913] hover:bg-[#d97a0e] text-white px-3 py-1.5 rounded-xl font-bold transition-all shadow-md shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة صنف خشب آخر</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="space-y-0">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="sm:col-span-5">
                    <label className="block font-bold text-slate-700 mb-1">الصنف والمنتج</label>
                    <Select
                      value={
                        item.productId === 'NEW_PRODUCT'
                          ? { value: 'NEW_PRODUCT', label: '➕ إنشاء صنف خشب جديد مباشرةً...' }
                          : {
                            value: item.productId,
                            label: products.find((p) => p.id === item.productId)
                              ? currentUser?.role === 'admin'
                                ? `${products.find((p) => p.id === item.productId)?.code} | ${products.find((p) => p.id === item.productId)?.name} (${products.find((p) => p.id === item.productId)?.specs}) — الرصيد: ${formatArabicNumber(products.find((p) => p.id === item.productId)?.volumeM3 || 0, 4)} m³`
                                : `${products.find((p) => p.id === item.productId)?.code} | ${products.find((p) => p.id === item.productId)?.name} (${products.find((p) => p.id === item.productId)?.specs})`
                              : item.productName || '',
                          }
                      }
                      onChange={(option: any) => handleProductChange(index, option.value)}
                      options={[
                        {
                          value: 'NEW_PRODUCT',
                          label: '➕ إنشاء صنف خشب جديد مباشرةً...',
                        },
                        ...products.map((p) => ({
                          value: p.id,
                          label: currentUser?.role === 'admin'
                            ? `${p.code} | ${p.name} (${p.specs}) — الرصيد: ${formatArabicNumber(p.volumeM3, 4)} m³`
                            : `${p.code} | ${p.name} (${p.specs})`,
                        })),
                      ]}
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderRadius: '0.75rem',
                          borderColor: '#e2e8f0',
                          padding: '0',
                          fontWeight: 'bold',
                          fontFamily: 'inherit',
                        })
                      }}
                      placeholder="ابحث عن كود أو اسم الخشب..."
                      isSearchable
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">الكمية (m³)</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={item.volumeM3 || ''}
                      onChange={(e) => handleVolumeChange(index, parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">سعر المتر (ج.م)</label>
                    <input
                      type="number"
                      required
                      value={item.pricePerM3 || ''}
                      onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2 text-left">
                    <label className="block font-bold text-slate-500 mb-1">إجمالي الصنف</label>
                    <span className="font-mono font-bold text-slate-900 text-sm block py-1.5">
                      {formatArabicNumber(item.total, 0)} ج.م
                    </span>
                  </div>

                  <div className="sm:col-span-1 text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        className="p-2 text-rose-500 hover:text-rose-700 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {inlineNewProductIndex === index && (
                  <div className="sm:col-span-12 bg-amber-50/50 p-4 rounded-xl border border-amber-200/50 mt-2">
                    <div className="flex items-center gap-2 mb-3 text-amber-600">
                      <Package className="w-5 h-5" />
                      <h4 className="font-bold text-sm">إنشاء صنف خشب جديد وإضافته للفاتورة</h4>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block font-extrabold text-slate-800 mb-1">
                          بيان صنف الخشب (الكود / اسم المنتج / المواصفات)
                        </label>
                        <input
                          type="text"
                          placeholder="مثال: MTSA-SH 100/19 | خشب سويد فنلندي | 100 × 19 مم"
                          value={newProductFullTitle}
                          onChange={(e) => setNewProductFullTitle(e.target.value)}
                          className="w-full p-2.5 bg-white border border-amber-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-400/30"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          💡 أكتب كود الخشب واسمه ومواصفاته في حقل واحد مفصول بعلامة |.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            الكمية الافتتاحية (m³)
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            min="0"
                            placeholder="0"
                            value={newProductVolumeM3 || ''}
                            onChange={(e) => setNewProductVolumeM3(parseFloat(e.target.value) || 0)}
                            className="w-full p-2.5 bg-white border border-amber-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-400/30"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">سعر المتر المكعب (ج.م)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="14500"
                            value={newProductPricePerM3 || ''}
                            onChange={(e) => setNewProductPricePerM3(parseFloat(e.target.value) || 0)}
                            className="w-full p-2.5 bg-white border border-amber-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-400/30"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">الملاحظات والتفاصيل</label>
                          <textarea
                            rows={1}
                            value={newProductNotes}
                            onChange={(e) => setNewProductNotes(e.target.value)}
                            placeholder="ملاحظات الصنف، بلد الاستيراد، درجة الخشب..."
                            className="w-full p-2 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400/30"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <button
                        type="button"
                        onClick={() => handleInlineNewProductSave(index)}
                        disabled={!newProductFullTitle.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                        حفظ الصنف واختياره فوراً للفاتورة
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInlineNewProductIndex(null);
                          const p = products[0];
                          if (p) {
                            handleProductChange(index, p.id);
                          }
                        }}
                        className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-600">
              إجمالي التكعيب بالفاتورة: <strong className="text-slate-900 text-sm">{formatArabicNumber(totalVolumeM3, 4)} m³</strong>
            </span>
            <span className="font-black text-slate-900 text-base">
              الإجمالي الكلي: <strong className="text-[#f28913]">{formatArabicNumber(totalAmount, 0)} ج.م</strong>
            </span>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <label className="block font-bold text-slate-700">ملاحظات وشروط الفاتورة</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات التسليم، الشحن، الشروط الشفهية..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#f28913]/30 font-medium"
          />
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center min-w-[220px] gap-2 bg-[#f28913] hover:bg-[#d97a0e] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>حفظ الفاتورة وترحيل الحسابات</span>
              </>
            )}
          </button>
        </div>
      </form>


    </div>
  );
};
