import React, { useState } from 'react';
import Header from './components/common/Header';
import PlannerView from './components/planner/PlannerView';
import ResidentView from './components/resident/ResidentView';
import CourierView from './components/courier/CourierView';

export default function App() {
  const [currentTab, setCurrentTab] = useState('planner');
  const [isHardwareSimulated, setIsHardwareSimulated] = useState(true);

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col font-sans">
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isHardwareSimulated={isHardwareSimulated}
        setIsHardwareSimulated={setIsHardwareSimulated}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'planner' && <PlannerView />}
        {currentTab === 'resident' && <ResidentView />}
        {currentTab === 'courier' && <CourierView />}
      </main>

      {/* Engineering Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <p>
          Sime Darby Property Hackathon Prototype | Carrier-Neutral Township Parcel Pickup Network
        </p>
      </footer>
    </div>
  );
}
