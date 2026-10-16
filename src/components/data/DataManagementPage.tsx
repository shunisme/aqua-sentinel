import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MeterReading } from '../../types';
import {
  Database,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  RotateCcw,
  Info,
  Layers,
  ArrowRight,
  X,
} from 'lucide-react';

interface ParsedRow {
  rowNum: number;
  buildingId: string;
  meterId: string;
  timestamp: string;
  consumptionLitres: number;
  isValid: boolean;
  errors: string[];
}

export const DataManagementPage: React.FC = () => {
  const { buildings, readings, importReadings, resetToDemoData } = useApp();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importSummary, setImportSummary] = useState<{
    totalRows: number;
    validRows: number;
    invalidRows: number;
    imported: boolean;
    importedCount?: number;
    duplicateCount?: number;
  } | null>(null);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Valid building IDs set
  const validBuildingIds = new Set(buildings.map((b) => b.id));

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const templateContent =
      `building_id,timestamp,consumption_litres,meter_id\n` +
      `BLD-101,2026-10-12T10:00:00Z,210,MTR-101-UM\n` +
      `BLD-102,2026-10-12T02:00:00Z,175,MTR-102-KK5\n` +
      `BLD-106,2026-10-12T15:00:00Z,1280,MTR-106-BIO\n` +
      `BLD-103,2026-10-12T11:00:00Z,130,MTR-103-ENG\n`;

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'aqua_sentinel_meter_readings_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Parse CSV File
  const parseCSVContent = (text: string) => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
    if (lines.length < 2) {
      alert('CSV file appears empty or missing header row.');
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const idxBuilding = headers.indexOf('building_id');
    const idxTime = headers.indexOf('timestamp');
    const idxLitres = headers.findIndex((h) => h.includes('consumption') || h.includes('litres'));
    const idxMeter = headers.indexOf('meter_id');

    if (idxBuilding === -1 || idxTime === -1 || idxLitres === -1) {
      alert(
        `Required column headers missing! Found: ${headers.join(
          ', '
        )}. Required: 'building_id', 'timestamp', 'consumption_litres'.`
      );
      return;
    }

    const rows: ParsedRow[] = [];
    let validCount = 0;
    let invalidCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length < 3) continue;

      const bId = parts[idxBuilding] || '';
      const tStr = parts[idxTime] || '';
      const rawLitres = parts[idxLitres] || '';
      const mId = idxMeter !== -1 && parts[idxMeter] ? parts[idxMeter] : `MTR-${bId}`;

      const rowErrors: string[] = [];

      // Validate buildingId
      if (!bId) {
        rowErrors.push('Missing building_id');
      } else if (!validBuildingIds.has(bId)) {
        rowErrors.push(`Unknown facility ID '${bId}'`);
      }

      // Validate timestamp
      const parsedTime = new Date(tStr);
      if (!tStr || isNaN(parsedTime.getTime())) {
        rowErrors.push('Invalid ISO timestamp');
      }

      // Validate numeric litres
      const litresNum = parseFloat(rawLitres);
      if (isNaN(litresNum) || litresNum < 0) {
        rowErrors.push('Consumption must be positive number');
      }

      const isValid = rowErrors.length === 0;
      if (isValid) validCount++;
      else invalidCount++;

      rows.push({
        rowNum: i,
        buildingId: bId,
        meterId: mId,
        timestamp: tStr,
        consumptionLitres: isNaN(litresNum) ? 0 : litresNum,
        isValid,
        errors: rowErrors,
      });
    }

    setParsedRows(rows);
    setImportSummary({
      totalRows: rows.length,
      validRows: validCount,
      invalidRows: invalidCount,
      imported: false,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSVContent(text);
    };
    reader.readAsText(file);
  };

  const handleCommitImport = () => {
    if (!importSummary || importSummary.validRows === 0) return;

    const validReadings: MeterReading[] = parsedRows
      .filter((r) => r.isValid)
      .map((r, idx) => ({
        id: `IMP-${Date.now()}-${idx}`,
        buildingId: r.buildingId,
        meterId: r.meterId,
        timestamp: r.timestamp,
        consumptionLitres: r.consumptionLitres,
        expectedLitres:
          buildings.find((b) => b.id === r.buildingId)?.baselineDailyLitres
            ? Math.round((buildings.find((b) => b.id === r.buildingId)!.baselineDailyLitres) / 24)
            : 150,
      }));

    const result = importReadings(validReadings);

    setImportSummary({
      ...importSummary,
      imported: true,
      importedCount: result.importedCount,
      duplicateCount: result.duplicateCount,
    });
  };

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#0F172A] tracking-tight">
              Telemetry Ingestion & CSV Data Management
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2D6A4F] border border-[#BFDBFE] font-medium">
              GATEWAY SYNC
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            Batch upload water meter CSV files, validate schema integrity, and recalculate anomaly detection models.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#0F172A] rounded-md text-xs font-medium border border-[#E2E8F0] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#64748B]" />
            <span>CSV Template</span>
          </button>

          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FBECEC] hover:bg-[#F8DCDC] text-[#B54747] rounded-md text-xs font-medium border border-[#EDBEBE] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Dataset</span>
          </button>
        </div>
      </div>

      {/* Dataset Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#64748B] uppercase font-medium block">Registered Facilities</span>
            <p className="text-xl font-mono font-semibold text-[#0F172A] tabular-nums mt-0.5">{buildings.length}</p>
          </div>
          <span className="text-[10px] font-mono text-[#2D6A4F] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
            20 Monitored
          </span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#64748B] uppercase font-medium block">Telemetry Records in Cache</span>
            <p className="text-xl font-mono font-semibold text-[#0F172A] tabular-nums mt-0.5">
              {readings.length.toLocaleString()}
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
            14-Day Baseline
          </span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#64748B] uppercase font-medium block">Storage Persistence</span>
            <p className="text-sm font-semibold text-[#0F172A] mt-1">Browser LocalStorage</p>
          </div>
          <span className="text-[10px] font-mono text-[#2D6A4F] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
            Active Cache
          </span>
        </div>
      </div>

      {/* File Upload Zone */}
      <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A]">
          Upload Meter Readings CSV File
        </h2>

        <div
          className={`border border-dashed rounded-lg p-6 text-center transition-colors relative cursor-pointer ${
            dragActive ? 'border-[#2563EB] bg-[#EFF6FF]' : 'border-[#E2E8F0] hover:border-[#2563EB] bg-[#F8FAFC]'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file) {
              setSelectedFileName(file.name);
              const reader = new FileReader();
              reader.onload = (event) => parseCSVContent(event.target?.result as string);
              reader.readAsText(file);
            }
          }}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center pointer-events-none">
            <UploadCloud className="w-8 h-8 text-[#2563EB] mb-1.5" />
            <p className="text-xs font-semibold text-[#0F172A]">
              {selectedFileName ? selectedFileName : 'Drag and drop your CSV file here, or click to browse'}
            </p>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Required headers: <code className="font-mono bg-white px-1 py-0.2 rounded border border-[#E2E8F0]">building_id</code>,{' '}
              <code className="font-mono bg-white px-1 py-0.2 rounded border border-[#E2E8F0]">timestamp</code>,{' '}
              <code className="font-mono bg-white px-1 py-0.2 rounded border border-[#E2E8F0]">consumption_litres</code>
            </p>
          </div>
        </div>

        {/* Validation Summary Card */}
        {importSummary && (
          <div className="p-3.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs">
              <span className="font-medium text-[#0F172A]">
                Parsed {importSummary.totalRows} row(s):
              </span>
              <span className="flex items-center gap-1 text-[#2D6A4F] font-mono font-medium bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {importSummary.validRows} Valid
              </span>
              {importSummary.invalidRows > 0 && (
                <span className="flex items-center gap-1 text-[#B54747] font-mono font-medium bg-[#FBECEC] px-2 py-0.5 rounded border border-[#EDBEBE]">
                  <XCircle className="w-3.5 h-3.5" />
                  {importSummary.invalidRows} Errors Found
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {importSummary.imported ? (
                <div className="flex items-center gap-1.5 text-xs text-[#2D6A4F] font-medium font-mono">
                  <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
                  <span>
                    Successfully ingested {importSummary.importedCount} readings (
                    {importSummary.duplicateCount} duplicates skipped).
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleCommitImport}
                  disabled={importSummary.validRows === 0}
                  className="px-3.5 py-1.5 bg-[#0F2744] hover:bg-[#1E3A5F] text-white rounded-md text-xs font-medium disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Commit & Ingest {importSummary.validRows} Valid Readings
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Row-Level Preview Table */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
          <div className="p-3 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
              Parsed Preview Table (First {Math.min(10, parsedRows.length)} rows)
            </h3>
            <span className="text-[11px] text-[#64748B]">
              Verify row format prior to committing to data cache
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold uppercase text-[10px] border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-2.5 px-3.5">Row</th>
                  <th className="py-2.5 px-3.5">Facility ID</th>
                  <th className="py-2.5 px-3.5">Meter ID</th>
                  <th className="py-2.5 px-3.5">Timestamp</th>
                  <th className="py-2.5 px-3.5">Consumption (L)</th>
                  <th className="py-2.5 px-3.5">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-mono text-[11px]">
                {parsedRows.slice(0, 10).map((r) => (
                  <tr
                    key={r.rowNum}
                    className={`hover:bg-[#F8FAFC] ${r.isValid ? '' : 'bg-[#FBECEC]/40'}`}
                  >
                    <td className="py-2 px-3.5 text-[#64748B]">#{r.rowNum}</td>
                    <td className="py-2 px-3.5 font-medium text-[#0F172A]">{r.buildingId}</td>
                    <td className="py-2 px-3.5 text-[#64748B]">{r.meterId}</td>
                    <td className="py-2 px-3.5 text-[#64748B]">{r.timestamp}</td>
                    <td className="py-2 px-3.5 font-semibold text-[#0F172A] tabular-nums">
                      {r.consumptionLitres.toLocaleString()} L
                    </td>
                    <td className="py-2 px-3.5">
                      {r.isValid ? (
                        <span className="text-[10px] font-medium text-[#2D6A4F] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                          ✓ Valid
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-[#B54747] bg-[#FBECEC] px-2 py-0.5 rounded border border-[#EDBEBE]">
                          {r.errors.join(', ')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Factory Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F2744]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-xl border border-[#E2E8F0] p-5 space-y-3">
            <div className="flex items-center gap-2.5 text-[#B54747]">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-semibold text-sm text-[#0F172A]">
                Restore Baseline University Telemetry?
              </h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              This will reinitialize the 20 university facilities, 14 days of diurnal smart meter readings, active anomaly scenarios, and verified maintenance case studies.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToDemoData();
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-1.5 bg-[#B54747] hover:bg-[#9E3A3A] text-white text-xs font-medium rounded-md cursor-pointer transition-colors"
              >
                Confirm Factory Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
