import React, { useState } from 'react';
import { Route, GripVertical, Printer, Save, CheckCircle, MapPin, Phone } from 'lucide-react';
import { useCustomerSupplierStore } from '../../store/customerSupplierStore';
import type { CollectionRouteItem } from '../../types';

export const CollectionRoute: React.FC = () => {
  const { customers } = useCustomerSupplierStore();

  const indebtedCustomers = customers.filter((c) => c.balance > 0);

  const [routeItems, setRouteItems] = useState<CollectionRouteItem[]>(
    indebtedCustomers.map((c, index) => ({
      id: 'r_' + c.id,
      customerId: c.id,
      customerName: c.name,
      address: c.address,
      phone: c.phone,
      dueAmount: c.balance,
      order: index + 1,
      notes: c.notes || 'تحصيل كاش أو انستا باي',
    }))
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Reorder items when the user types a new sequence number
  const handleOrderInputChange = (id: string, newOrder: number) => {
    if (isNaN(newOrder) || newOrder < 1) return;

    const updated = routeItems.map((item) => {
      if (item.id === id) {
        return { ...item, order: newOrder };
      }
      return item;
    });

    // Sort array based on sequence numbers
    updated.sort((a, b) => a.order - b.order);

    // Re-index to clean 1..N order
    const reindexed = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
    setRouteItems(reindexed);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...routeItems];
    const itemToMove = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, itemToMove);

    const reordered = updated.map((item, i) => ({ ...item, order: i + 1 }));
    setDraggedIndex(index);
    setRouteItems(reordered);
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Route className="w-6 h-6 text-[#f28913]" />
            <span>تقرير خط سير التحصيل اليومي</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ترتيب العملاء المدينين بتغيير رقم التسلسل المباشر أو بالسحب والإفلات (Drag & Drop) وطباعتها.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#f28913] hover:bg-[#d97a0e] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-orange-500/25 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>حفظ ترتيب خط السير</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة تقرير خط السير</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>تم حفظ ترتيب خط سير التحصيل بنجاح!</span>
        </div>
      )}

      {/* Printable Sheet Container */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
        <div className="flex items-start justify-between pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-[#f28913] text-white flex items-center justify-center font-bold text-lg">
                م
              </div>
              <h1 className="text-xl font-black text-slate-900">شركة المحبة لتجارة الأخشاب</h1>
            </div>
            <p className="text-xs text-slate-500">تقرير خط سير التحصيل والمحصلين اليومي</p>
          </div>

          <div className="text-left">
            <h3 className="text-lg font-black text-slate-900">جدول خط سير التحصيل</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              تاريخ السير: {new Date().toLocaleDateString('ar-EG')}
            </p>
          </div>
        </div>

        {/* Total Route Summary Box */}
        <div className="bg-orange-50/60 p-4 rounded-2xl border border-orange-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-600 font-medium">عدد محطات التحصيل المطلوب زيارتها:</span>
            <strong className="text-slate-900 font-bold text-sm mr-2">{routeItems.length} عملاء</strong>
          </div>
          <div>
            <span className="text-slate-600 font-medium">إجمالي المبالغ المطلوبة للتحصيل:</span>
            <strong className="text-lg font-black text-[#f28913] mr-2">
              {routeItems.reduce((acc, r) => acc + r.dueAmount, 0).toLocaleString()} ج.م
            </strong>
          </div>
        </div>

        {/* Sequence Order List with Direct Number Inputs & Drag/Drop */}
        <div className="space-y-3">
          {routeItems.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#f28913] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2 shrink-0">
                  <GripVertical className="w-5 h-5 text-slate-400 cursor-move print:hidden" />

                  {/* Direct Sequence Input Number Box (Interactive Number Box) */}
                  <div className="flex items-center gap-1 bg-slate-900 text-amber-400 font-extrabold px-2.5 py-1.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold print:hidden">مُحطة:</span>
                    <input
                      type="number"
                      min={1}
                      max={routeItems.length}
                      value={item.order}
                      onChange={(e) => handleOrderInputChange(item.id, parseInt(e.target.value) || 1)}
                      className="w-10 bg-transparent text-center font-black text-amber-400 focus:outline-none focus:bg-slate-800 rounded font-mono text-sm print:hidden"
                      title="غير هذا الرقم لترتيب العميل فوراً في خط السير"
                    />
                    <span className="hidden print:inline font-mono text-sm">{item.order}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{item.customerName}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-[#f28913]" />
                      {item.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#f28913]" />
                      {item.address}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                <div className="text-left shrink-0">
                  <span className="text-[10px] text-slate-400 font-medium block">المبلغ المطلوب تحصيله</span>
                  <strong className="text-base font-black text-rose-600">
                    {item.dueAmount.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span>
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Print Signatures */}
        <div className="pt-8 grid grid-cols-2 text-center text-xs font-bold text-slate-600 border-t border-slate-200">
          <div>
            <p>توقيع مندوب التحصيل / السائق</p>
            <div className="h-12"></div>
            <p className="text-slate-400 font-normal">....................................................</p>
          </div>
          <div>
            <p>توقيع المسؤول الإداري</p>
            <div className="h-12"></div>
            <p className="text-slate-400 font-normal">....................................................</p>
          </div>
        </div>
      </div>
    </div>
  );
};
