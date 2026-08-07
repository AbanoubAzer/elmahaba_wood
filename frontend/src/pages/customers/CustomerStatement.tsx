import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Printer, PlusCircle, ChevronRight, Calendar, ShoppingCart, CheckCircle2, Trash2, Plus, Wallet, Loader2 } from 'lucide-react';
import { useCustomerSupplierStore } from '../../store/customerSupplierStore';
import { useTreasuryStore } from '../../store/treasuryStore';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useWoodStore } from '../../store/woodStore';
import type { PaymentMethod } from '../../types';
import { toArabicDigits, formatArabicNumber, formatArabicDate } from '../../utils/numberUtils';
import { getPaymentMethodBadge } from '../../utils/paymentUtils';
import { SmartDateFilters } from '../../components/ui/SmartDateFilters';
import toast from 'react-hot-toast';
import Select from 'react-select';

interface QuickInvoiceItem {
  productId: string;
  volumeM3: number;
  pricePerM3: number;
}

interface PaymentSplit {
  method: PaymentMethod;
  amount: number;
  treasuryId: string;
}

export const CustomerStatement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { customers, getCustomerLedger, addLedgerEntry } = useCustomerSupplierStore();
  const { treasuries, updateBalance } = useTreasuryStore();
  const { invoices, createInvoice } = useInvoiceStore();
  const { products } = useWoodStore();

  const customer = customers.find((c) => c.id === id);
  const ledgerEntries = id ? getCustomerLedger(id) : [];

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Payment Receipt State
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedTreasuryId, setSelectedTreasuryId] = useState(treasuries[0]?.id || '');
  const [notes, setNotes] = useState('');

  // Manual Ledger Entry State (Discount / Settlement)
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [manualEntryType, setManualEntryType] = useState<'discount' | 'addition'>('discount');
  const [manualEntryAmount, setManualEntryAmount] = useState(0);
  const [manualEntryNotes, setManualEntryNotes] = useState('');

  // Quick Invoice Multi-Item Modal State
  const [invoiceItems, setInvoiceItems] = useState<QuickInvoiceItem[]>([
    {
      productId: products[0]?.id || '',
      volumeM3: 1.0,
      pricePerM3: products[0]?.pricePerM3 || 14500,
    },
  ]);

  // Multi-Payment Method Split State
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([
    {
      method: 'cash',
      amount: 0,
      treasuryId: treasuries[0]?.id || 't1',
    },
  ]);

  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!customer) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-slate-500 font-bold text-sm">العميل غير موجود</p>
        <Link to="/customers" className="text-[#f28913] font-bold text-xs mt-2 inline-block">
          العودة لقائمة العملاء
        </Link>
      </div>
    );
  }

  const filteredEntries = ledgerEntries.filter((row) => {
    if (startDate && row.date < startDate) return false;
    if (endDate && row.date > endDate) return false;
    if (row.description.includes('دفعة محصلة من فاتورة') || row.description.includes('دفعة مسددة من فاتورة')) return false;
    return true;
  });

  // Calculate mathematically exact running balances for customer statement
  let runningBalanceMath = 0;


  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const getMethodLabel = (method: string) => {
        switch (method) {
          case 'instapay': return 'انستا باي';
          case 'bank_transfer': return 'تحويل بنكي';
          case 'vodafone_cash': return 'محفظة إلكترونية';
          case 'check': return 'شيك بنكي';
          default: return 'كاش';
        }
      };

      addLedgerEntry({
        date: new Date().toISOString().split('T')[0],
        partyType: 'customer',
        partyId: customer.id,
        partyName: customer.name,
        description: `سند تحصيل مباشر (${getMethodLabel(paymentMethod)})`,
        debit: 0,
        credit: amount,
        notes: notes || 'تحصيل من شاشة كشف الحساب',
      });

      updateBalance(selectedTreasuryId, amount, 'deposit');

      setShowPaymentModal(false);
      setAmount(0);
      setNotes('');
      toast.success('تم تسجيل التحصيل النقدي بنجاح');
      setIsSubmitting(false);
    }, 500);
  };

  const handleManualEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualEntryAmount <= 0) return;

    setIsSubmitting(true);
    setTimeout(() => {
      // For a customer: 
      // Discount (خصم/تسوية دائنة) decreases their debt -> credit
      // Addition (إضافة رصيد/تسوية مدينة) increases their debt -> debit

      addLedgerEntry({
        date: new Date().toISOString().split('T')[0],
        partyType: 'customer',
        partyId: customer.id,
        partyName: customer.name,
        description: manualEntryType === 'discount' ? 'خصم / تسوية دائنة (تخفيض حساب)' : 'إضافة / تسوية مدينة (زيادة حساب)',
        debit: manualEntryType === 'addition' ? manualEntryAmount : 0,
        credit: manualEntryType === 'discount' ? manualEntryAmount : 0,
        notes: manualEntryNotes || 'تسوية يدوية من كشف الحساب',
      });

      setShowManualEntryModal(false);
      setManualEntryAmount(0);
      setManualEntryNotes('');
      toast.success('تم إضافة قيد التسوية بنجاح');
      setIsSubmitting(false);
    }, 500);
  };

  // Multi-Item Handlers
  const handleAddItem = () => {
    const defaultProd = products[0];
    setInvoiceItems([
      ...invoiceItems,
      {
        productId: defaultProd?.id || '',
        volumeM3: 1.0,
        pricePerM3: defaultProd?.pricePerM3 || 14500,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (invoiceItems.length === 1) return;
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof QuickInvoiceItem, value: any) => {
    const updated = [...invoiceItems];
    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      updated[index] = {
        ...updated[index],
        productId: value,
        pricePerM3: prod ? prod.pricePerM3 : updated[index].pricePerM3,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setInvoiceItems(updated);
  };

  // Multi-Payment Split Handlers
  const handleAddPaymentSplit = () => {
    setPaymentSplits([
      ...paymentSplits,
      {
        method: 'instapay',
        amount: 0,
        treasuryId: treasuries[0]?.id || 't1',
      },
    ]);
  };

  const handleRemovePaymentSplit = (index: number) => {
    if (paymentSplits.length === 1) return;
    setPaymentSplits(paymentSplits.filter((_, i) => i !== index));
  };

  const handlePaymentSplitChange = (index: number, field: keyof PaymentSplit, value: any) => {
    const updated = [...paymentSplits];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setPaymentSplits(updated);
  };

  const totalVolumeM3Sum = invoiceItems.reduce((sum, item) => sum + (item.volumeM3 || 0), 0);
  const totalAmountSum = invoiceItems.reduce((sum, item) => sum + (item.volumeM3 || 0) * (item.pricePerM3 || 0), 0);
  const totalPaidFromSplits = paymentSplits.reduce((sum, p) => sum + (p.amount || 0), 0);
  const currentRemainingAmount = Math.max(0, totalAmountSum - totalPaidFromSplits);

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invoiceItems.length === 0 || totalAmountSum <= 0) return;

    setIsSubmitting(true);
    try {
      const formattedItems = invoiceItems.map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const total = (item.volumeM3 || 0) * (item.pricePerM3 || 0);
        return {
          productId: item.productId,
          productCode: prod ? prod.code : 'WOOD-01',
          productName: prod ? prod.name : 'صنف خشب',
          volumeM3: item.volumeM3,
          pricePerM3: item.pricePerM3,
          total,
        };
      });

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
        invoiceNotes,
        paymentSummaryText ? `وسائل السداد: ${paymentSummaryText}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      await createInvoice(
        {
          date: new Date().toISOString().split('T')[0],
          type: 'sale',
          partyType: 'customer',
          partyId: customer.id,
          partyName: customer.name,
          items: formattedItems,
          totalVolumeM3: totalVolumeM3Sum,
          totalAmount: totalAmountSum,
          paidAmount: Math.min(totalPaidFromSplits, totalAmountSum),
          remainingAmount: currentRemainingAmount,
          paymentType: totalPaidFromSplits >= totalAmountSum ? 'cash' : totalPaidFromSplits > 0 ? 'partial' : 'credit',
          paymentMethod: paymentSplits[0]?.method || 'cash',
          treasuryId: paymentSplits[0]?.treasuryId || selectedTreasuryId,
          notes: combinedNotes || 'فاتورة مبيعات جديدة من كشف الحساب',
          createdBy: 'المحاسب العام',
        },
        'المحاسب العام',
        'أدمن'
      );

      // Apply secondary payment splits to treasuries if multiple splits exist
      paymentSplits.slice(1).forEach((split) => {
        if (split.amount > 0) {
          updateBalance(split.treasuryId, split.amount, 'deposit');
        }
      });

      setShowInvoiceModal(false);
      setInvoiceItems([
        {
          productId: products[0]?.id || '',
          volumeM3: 1.0,
          pricePerM3: products[0]?.pricePerM3 || 14500,
        },
      ]);
      setPaymentSplits([
        {
          method: 'cash',
          amount: 0,
          treasuryId: treasuries[0]?.id || 't1',
        },
      ]);
      setInvoiceNotes('');
      toast.success('تم تسجيل الفاتورة بنجاح');
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ الفاتورة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            to="/customers"
            className="p-2 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#f28913]" />
              <span>كشف حساب عميل - {customer.name}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">تفاصيل الحركة المالية، الأخشاب المسلمة، والمقبوضات.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="flex items-center gap-2 bg-[#f28913] hover:bg-[#d97a0e] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-orange-500/20 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>+ إضافة فاتورة مبيعات جديدة</span>
          </button>

          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>سند تحصيل نقدي</span>
          </button>

          <button
            onClick={() => setShowManualEntryModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Wallet className="w-4 h-4" />
            <span>قيد تسوية / خصم</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-4 print:hidden">
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-600 text-xs">من:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-600 text-xs">إلى:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none"
              />
            </div>
            
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition-all"
              >
                إلغاء الفلترة
              </button>
            )}
          </div>
          <SmartDateFilters 
            onSelect={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }} 
          />
        </div>

        <div className="text-xs font-bold text-slate-600">
          إجمالي الرصيد المستحق: <span className="text-[#f28913] text-sm font-black">{formatArabicNumber(customer.balance, 0)} ج.م</span>
        </div>
      </div>

      {/* Printable Report Layout */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs print:shadow-none print:border-none print:p-0 w-full" dir="rtl">
        <style>
          {`
            @media print {
              @page { size: landscape; margin: 10mm; }
            }
          `}
        </style>
        {/* Report Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold mb-1">كشف حساب عميل</h1>
          <h2 className="text-xl font-bold text-slate-900">{customer.name}</h2>
          {customer.phone && <p className="text-slate-600 text-sm mt-1">تليفون: {toArabicDigits(customer.phone)}</p>}
          {customer.address && <p className="text-slate-500 text-xs">العنوان: {customer.address}</p>}
        </div>

        {/* Clean Ultra Structured Statement Table */}
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse border border-slate-400 text-[13px] print:text-[10px] text-right print:whitespace-nowrap">
            <thead className="bg-slate-100 font-bold">
              <tr>
                <th className="border border-slate-400 px-3 py-2 text-center w-28 whitespace-nowrap">التاريخ</th>
                <th className="border border-slate-400 px-3 py-2 text-center">بيان الحركة / تفاصيل الفاتورة / وسيلة الدفع</th>
                <th className="border border-slate-400 px-3 py-2 text-center w-24">الكمية (m³)</th>
                <th className="border border-slate-400 px-3 py-2 text-center w-24">سعر الـ m³</th>
                <th className="border border-slate-400 px-3 py-2 text-center w-28 text-rose-800">قيمة الفاتورة (مدين)</th>
                <th className="border border-slate-400 px-3 py-2 text-center w-28 text-emerald-800">المدفوعات (دائن)</th>
                <th className="border border-slate-400 px-3 py-2 text-center w-28">الرصيد التراكمي</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((row) => {
                const inv = row.invoice || (row.invoiceId ? invoices.find((i) => i.id === row.invoiceId) : null);
                const isInvoiceMainRow = inv && row.debit > 0 && !row.description.includes('دفعة');

                if (isInvoiceMainRow && inv) {
                  // Calculate exact balance impact for customer: + invoiceTotal - paidAmount
                  runningBalanceMath += (inv.totalAmount - inv.paidAmount);

                  return (
                    <React.Fragment key={`inv-clean-${row.id}`}>
                      {/* Main Invoice Header Row */}
                      <tr className="bg-slate-100/90 font-bold border-b border-slate-400 page-break-inside-avoid">
                        <td className="border border-slate-400 px-3 py-2 text-center font-bold text-slate-800">
                          {formatArabicDate(row.date)}
                        </td>
                        <td className="border border-slate-400 px-3 py-2 text-right font-black" colSpan={3}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-indigo-900 font-black">{row.description}</span>
                            <span className="text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg text-xs font-black">
                              إجمالي الفاتورة: {formatArabicNumber(inv.totalAmount, 0)} ج.م
                            </span>
                          </div>
                        </td>
                        <td className="border border-slate-400 px-3 py-2 text-center text-xs font-extrabold text-rose-700">
                          {formatArabicNumber(inv.totalAmount, 0)} ج.م
                        </td>
                        <td className="border border-slate-400 px-3 py-2 text-center text-xs font-extrabold text-emerald-700">
                          {inv.paidAmount > 0 ? `${formatArabicNumber(inv.paidAmount, 0)} ج.م` : '-'}
                        </td>
                        <td className="border border-slate-400 px-3 py-2 text-center font-black bg-slate-200 text-slate-900">
                          {formatArabicNumber(runningBalanceMath, 0)} ج.م
                        </td>
                      </tr>

                      {/* Dedicated Sub-Row for Payment Split Details */}
                      {inv.paidAmount > 0 && (
                        <tr className="bg-indigo-50/80 font-bold border-b border-slate-300 page-break-inside-avoid text-xs">
                          <td className="border border-slate-300 px-3 py-1.5 text-center text-indigo-700 font-black">💳</td>
                          <td className="border border-slate-300 px-3 py-1.5 text-right font-bold text-indigo-950" colSpan={6}>
                            <span className="text-indigo-900 font-bold ml-2">تفاصيل وسيلة وتوزيع الدفع والسداد:</span>
                            {getPaymentMethodBadge(inv, row)}
                          </td>
                        </tr>
                      )}

                      {/* Itemized Wood Breakdown Rows */}
                      {inv.items.map((item, itemIdx) => (
                        <tr key={`${row.id}-item-${itemIdx}`} className="page-break-inside-avoid bg-white hover:bg-slate-50 text-xs">
                          <td className="border border-slate-300 px-3 py-1.5 text-center text-slate-400 text-[11px]">
                            {toArabicDigits(itemIdx + 1)}
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 text-right font-medium text-slate-800 pr-6">
                            ↳ {toArabicDigits(item.productCode)} | {item.productName}
                          </td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center">{formatArabicNumber(item.volumeM3, 4)} m³</td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center">{formatArabicNumber(item.pricePerM3, 0)}</td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center font-semibold text-rose-600">{formatArabicNumber(item.total, 0)}</td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center text-slate-400">-</td>
                          <td className="border border-slate-300 px-3 py-1.5 text-center text-slate-400 bg-slate-50/50">-</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                } else {
                  // Calculate exact balance impact for customer standalone collection: + debit - credit
                  runningBalanceMath += (row.debit - row.credit);

                  return (
                    <tr key={row.id} className="page-break-inside-avoid bg-slate-50/50 hover:bg-slate-100/60">
                      <td className="border border-slate-400 px-3 py-2 text-center whitespace-nowrap">{formatArabicDate(row.date)}</td>
                      <td className="border border-slate-400 px-3 py-2 text-right font-medium">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-800">{row.description}</span>
                          {getPaymentMethodBadge(null, row)}
                        </div>
                      </td>
                      <td className="border border-slate-400 px-3 py-2 text-center">{row.volumeM3 ? `${formatArabicNumber(row.volumeM3, 4)} m³` : '-'}</td>
                      <td className="border border-slate-400 px-3 py-2 text-center">{row.pricePerM3 ? `${formatArabicNumber(row.pricePerM3, 0)}` : '-'}</td>
                      <td className="border border-slate-400 px-3 py-2 text-center text-rose-700 font-bold">{row.debit > 0 ? `${formatArabicNumber(row.debit, 0)} ج.م` : '-'}</td>
                      <td className="border border-slate-400 px-3 py-2 text-center text-emerald-700 font-extrabold">{row.credit > 0 ? `${formatArabicNumber(row.credit, 0)} ج.م` : '-'}</td>
                      <td className="border border-slate-400 px-3 py-2 text-center font-black bg-slate-100">{formatArabicNumber(runningBalanceMath, 0)} ج.م</td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Signature Area */}
        <div className="mt-12 flex justify-between px-12 print:mt-12 page-break-inside-avoid">
          <div className="text-center">
            <p className="font-bold border-b-2 border-slate-400 w-32 pb-1 mb-2 text-sm">توقيع المستلم</p>
          </div>
          <div className="text-center">
            <p className="font-bold border-b-2 border-slate-400 w-32 pb-1 mb-2 text-sm">توقيع المحاسب</p>
          </div>
        </div>
      </div>

      {/* Multi-Item & Multi-Payment Quick Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 animate-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#f28913]" />
                <span>إضافة فاتورة مبيعات جديدة للعميل: {customer.name}</span>
              </h3>
              <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 font-bold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleInvoiceSubmit} className="space-y-4 text-xs">
              {/* Dynamic Wood Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">بنود الأخشاب بالفاتورة:</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold transition-all text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة صنف آخر</span>
                  </button>
                </div>

                {invoiceItems.map((item, idx) => {
                  const itemTotal = (item.volumeM3 || 0) * (item.pricePerM3 || 0);
                  return (
                    <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5 relative">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                          صنف رقم {toArabicDigits(idx + 1)}
                        </span>
                        {invoiceItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1 font-bold"
                            title="حذف هذا الصنف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-1">
                          <label className="block font-bold text-slate-700 mb-1">المنتج / الصنف:</label>
                          <Select
                            value={{
                              value: item.productId,
                              label: products.find(p => p.id === item.productId)
                                ? `${products.find(p => p.id === item.productId)?.code} | ${products.find(p => p.id === item.productId)?.name}`
                                : ''
                            }}
                            onChange={(option: any) => handleItemChange(idx, 'productId', option.value)}
                            options={products.map((p) => ({
                              value: p.id,
                              label: `${p.code} | ${p.name} (${p.specs})`
                            }))}
                            styles={{
                              control: (base) => ({
                                ...base,
                                borderRadius: '0.75rem',
                                borderColor: '#e2e8f0',
                                padding: '0',
                                fontWeight: 'bold',
                                fontFamily: 'inherit',
                                minWidth: '200px'
                              })
                            }}
                            placeholder="ابحث بالاسم أو الكود..."
                            isSearchable
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">الكمية (m³):</label>
                          <input
                            type="number"
                            step="0.0001"
                            required
                            min="0.0001"
                            value={item.volumeM3 || ''}
                            onChange={(e) => handleItemChange(idx, 'volumeM3', parseFloat(e.target.value) || 0)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">سعر المتر (ج.م):</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.pricePerM3 || ''}
                            onChange={(e) => handleItemChange(idx, 'pricePerM3', parseFloat(e.target.value) || 0)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="text-left font-bold text-slate-700 text-[11px]">
                        إجمالي الصنف: <span className="text-emerald-700 font-black">{formatArabicNumber(itemTotal, 0)} ج.م</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Summary Badge */}
              <div className="p-3.5 bg-gradient-to-r from-slate-900 to-[#1e293b] text-white rounded-2xl flex items-center justify-between font-bold">
                <div>
                  <span className="text-xs text-slate-300 block">إجمالي الكمية: {formatArabicNumber(totalVolumeM3Sum, 4)} m³</span>
                  <span className="text-xs text-[#f28913] font-bold">إجمالي الفاتورة المطلوب:</span>
                </div>
                <span className="text-lg text-[#f28913] font-black">{formatArabicNumber(totalAmountSum, 0)} ج.م</span>
              </div>

              {/* Multi-Payment Methods Split Section */}
              <div className="space-y-3 p-3 bg-[#131b2f]/5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-[#f28913]" />
                    <span>تفاصيل طرق وسداد المدفوعات (يمكن تقسيم المبلغ على أكثر من طريقة):</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPaymentSplit}
                    className="flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-xl font-bold transition-all text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ إضافة طريقة دفع ثانية</span>
                  </button>
                </div>

                {paymentSplits.map((split, sIdx) => (
                  <div key={sIdx} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end bg-white p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">وسيلة السداد ({toArabicDigits(sIdx + 1)}):</label>
                      <select
                        value={split.method}
                        onChange={(e) => handlePaymentSplitChange(sIdx, 'method', e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                      >
                        <option value="cash">💵 نقداً (كاش)</option>
                        <option value="instapay">⚡ انستا باي (InstaPay)</option>
                        <option value="bank_transfer">🏦 تحويل بنكي</option>
                        <option value="vodafone_cash">📱 محفظة إلكترونية</option>
                        <option value="check">📄 شيك بنكي</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">المبلغ المسدد (ج.م):</label>
                      <input
                        type="number"
                        min="0"
                        value={split.amount || ''}
                        onChange={(e) => handlePaymentSplitChange(sIdx, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="grow">
                        <label className="block font-bold text-slate-700 text-[11px] mb-1">إيداع في خزانة:</label>
                        <select
                          value={split.treasuryId}
                          onChange={(e) => handlePaymentSplitChange(sIdx, 'treasuryId', e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
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
                          onClick={() => handleRemovePaymentSplit(sIdx)}
                          className="text-rose-500 hover:text-rose-700 p-2 font-bold shrink-0"
                          title="إزالة طريقة الدفع هذه"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between text-xs font-bold pt-1">
                  <span className="text-slate-600">مجموع المبالغ المسددة: <strong className="text-emerald-700">{formatArabicNumber(totalPaidFromSplits, 0)} ج.م</strong></span>
                  <span className="text-slate-600">الباقي آجل بكشف الحساب: <strong className="text-rose-600">{formatArabicNumber(currentRemainingAmount, 0)} ج.م</strong></span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات الفاتورة والتوريد</label>
                <textarea
                  rows={2}
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="ملاحظات التسليم، الموقع..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#f28913]/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{isSubmitting ? 'جاري الحفظ...' : 'تأكيد وتسجيل الفاتورة'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Deposit Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">تسجيل سند تحصيل نقدي (مقبوضات)</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 font-bold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">المبلغ المحصل (ج.م)</label>
                <input
                  type="number"
                  required
                  placeholder="مثال: 25000"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-emerald-700 focus:ring-2 focus:ring-[#f28913]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">وسيلة الدفع</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="cash">💵 نقداً (كاش)</option>
                  <option value="instapay">⚡ انستا باي (InstaPay)</option>
                  <option value="bank_transfer">🏦 تحويل بنكي</option>
                  <option value="vodafone_cash">📱 محفظة إلكترونية (فودافون كاش)</option>
                  <option value="check">📄 شيك بنكي</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">إيداع في الخزانة</label>
                <select
                  value={selectedTreasuryId}
                  onChange={(e) => setSelectedTreasuryId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  {treasuries.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (الرصيد: {formatArabicNumber(t.balance, 0)} ج.م)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات التحصيل والاتفاق</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="دفعة تحت الحساب، تحويل انستا باي..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#f28913]/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <span>تسجيل الدفعة النقدية</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Entry (Discount / Settlement) Modal */}
      {showManualEntryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100" dir="rtl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-600" />
                تسوية يدوية / خصم
              </h2>
              <button onClick={() => setShowManualEntryModal(false)} className="text-slate-400 font-bold text-lg hover:text-rose-500">&times;</button>
            </div>
            <form onSubmit={handleManualEntrySubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع القيد</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setManualEntryType('discount')}
                    className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${manualEntryType === 'discount'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                  >
                    تسوية دائنة (خصم)
                    <p className="text-[10px] font-normal opacity-80 mt-1">يقلل رصيد العميل</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualEntryType('addition')}
                    className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${manualEntryType === 'addition'
                        ? 'bg-rose-50 border-rose-500 text-rose-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                  >
                    تسوية مدينة (إضافة)
                    <p className="text-[10px] font-normal opacity-80 mt-1">يزيد رصيد العميل</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">المبلغ (ج.م)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={manualEntryAmount || ''}
                  onChange={(e) => setManualEntryAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 font-mono"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات / بيان القيد</label>
                <textarea
                  required
                  value={manualEntryNotes}
                  onChange={(e) => setManualEntryNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 resize-none h-20"
                  placeholder="مثال: خصم خاص للعميل، تسوية رصيد قديم..."
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowManualEntryModal(false)}
                  className="px-5 py-2 text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20"
                >
                  تأكيد وإضافة القيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
