import React from 'react';
import { Smartphone, Clock } from 'lucide-react';

export default function ResidentView() {
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
      <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
        <Smartphone className="w-7 h-7" />
      </div>
      <h3 className="font-bold text-slate-900 text-lg">Resident Mobile PWA</h3>
      <p className="text-sm text-slate-500">
        Ready for <strong>Stage 3</strong> implementation. Will include parcel tracking, locker unlock codes, QR code, neighbour collection sharing, and SIMULATED SMS PIN lookup.
      </p>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-mono">
        <Clock className="w-3.5 h-3.5" />
        Up next in Stage 3
      </div>
    </div>
  );
}
