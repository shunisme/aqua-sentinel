import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Building, BuildingCategory, CampusZone } from '../../types';
import { X, Building2, Check, AlertCircle } from 'lucide-react';

interface RegisterBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingToEdit?: Building | null;
}

export const RegisterBuildingModal: React.FC<RegisterBuildingModalProps> = ({
  isOpen,
  onClose,
  buildingToEdit,
}) => {
  const { addBuilding, updateBuilding } = useApp();

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: 'Lecture Hall' as BuildingCategory,
    zone: 'North Campus' as CampusZone,
    floors: 3,
    meterId: '',
    baselineDailyLitres: 4500,
    expectedDailyLitres: 4500,
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (buildingToEdit) {
      setFormData({
        id: buildingToEdit.id,
        name: buildingToEdit.name,
        category: buildingToEdit.category,
        zone: buildingToEdit.zone,
        floors: buildingToEdit.floors,
        meterId: buildingToEdit.meterId,
        baselineDailyLitres: buildingToEdit.baselineDailyLitres,
        expectedDailyLitres: buildingToEdit.expectedDailyLitres,
        description: buildingToEdit.description || '',
      });
    } else {
      setFormData({
        id: `BLD-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        category: 'Lecture Hall',
        zone: 'North Campus',
        floors: 3,
        meterId: `MTR-${Math.floor(1000 + Math.random() * 9000)}-MY`,
        baselineDailyLitres: 4500,
        expectedDailyLitres: 4500,
        description: '',
      });
    }
    setErrors({});
  }, [buildingToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.id.trim()) errs.id = 'Building ID is required';
    if (!formData.name.trim()) errs.name = 'Building name is required';
    if (!formData.meterId.trim()) errs.meterId = 'Meter identifier is required';
    if (formData.baselineDailyLitres <= 0)
      errs.baselineDailyLitres = 'Baseline must be greater than zero';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (buildingToEdit) {
      updateBuilding({
        ...buildingToEdit,
        ...formData,
      });
    } else {
      const newBuilding: Building = {
        ...formData,
        currentDailyLitres: formData.baselineDailyLitres,
        latestReadingTimestamp: new Date().toISOString(),
        anomalyStatus: 'Normal',
        openAlertsCount: 0,
        inspectionStatus: 'None',
        priorityScore: 10,
      };
      addBuilding(newBuilding);
    }
    onClose();
  };

  const categories: BuildingCategory[] = [
    'Hostel',
    'Laboratory',
    'Lecture Hall',
    'Library',
    'Sports Complex',
    'Administrative',
    'Dining & Retail',
  ];

  const zones: CampusZone[] = [
    'North Campus',
    'South Valley',
    'Science Park',
    'Residential Quarter',
    'Sports Hub',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0F2744]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg border border-[#E2E8F0] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0F2744] text-white flex items-center justify-between border-b border-[#1E3A5F]">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#60A5FA]" />
            <h3 className="font-semibold text-sm text-white">
              {buildingToEdit ? 'Edit Facility Details' : 'Register New Campus Facility'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#94A3B8] hover:text-white rounded hover:bg-[#1E3A5F] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Facility ID *
              </label>
              <input
                type="text"
                disabled={!!buildingToEdit}
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] font-mono text-[#0F172A] disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
              />
              {errors.id && <p className="text-[10px] text-[#B54747] mt-0.5">{errors.id}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Meter Identifier *
              </label>
              <input
                type="text"
                value={formData.meterId}
                onChange={(e) => setFormData({ ...formData, meterId: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] font-mono text-[#0F172A]"
              />
              {errors.meterId && <p className="text-[10px] text-[#B54747] mt-0.5">{errors.meterId}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Facility Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Faculty of Engineering Block E"
              className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] text-[#0F172A]"
            />
            {errors.name && <p className="text-[10px] text-[#B54747] mt-0.5">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Asset Classification *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as BuildingCategory })}
                className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] bg-white text-[#0F172A] cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Campus Zone *
              </label>
              <select
                value={formData.zone}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value as CampusZone })}
                className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] bg-white text-[#0F172A] cursor-pointer"
              >
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Floors / Levels
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.floors}
                onChange={(e) => setFormData({ ...formData, floors: parseInt(e.target.value) || 1 })}
                className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] font-mono tabular-nums text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Daily Baseline Flow (Litres) *
              </label>
              <input
                type="number"
                min="100"
                step="100"
                value={formData.baselineDailyLitres}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    baselineDailyLitres: parseFloat(e.target.value) || 0,
                    expectedDailyLitres: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] font-mono tabular-nums text-[#0F172A]"
              />
              {errors.baselineDailyLitres && (
                <p className="text-[10px] text-[#B54747] mt-0.5">{errors.baselineDailyLitres}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Primary academic complex housing chemical engineering labs and student washrooms."
              className="w-full text-xs px-3 py-2 border border-[#E2E8F0] rounded-md outline-none focus:border-[#2563EB] text-[#0F172A]"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] rounded-md cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium bg-[#0F2744] hover:bg-[#1E3A5F] text-white rounded-md cursor-pointer transition-colors"
            >
              {buildingToEdit ? 'Update Facility' : 'Register Facility'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
