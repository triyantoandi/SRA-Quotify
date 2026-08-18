import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, RefreshCw, X, ArrowRight, Info } from 'lucide-react';
import { Item } from '../types';
import { downloadItemExcelTemplate, parseItemsExcelFile, ItemImportPreview } from '../utils/excelHelpers';
import { formatIDR } from '../utils/helpers';

interface ItemsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingItems: Item[];
  onImportComplete: (importedItems: Item[], mode: 'UPSERT' | 'ADD_ONLY' | 'REPLACE') => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function ItemsImportModal({
  isOpen,
  onClose,
  existingItems,
  onImportComplete,
  showToast
}: ItemsImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<ItemImportPreview | null>(null);
  const [importMode, setImportMode] = useState<'UPSERT' | 'ADD_ONLY' | 'REPLACE'>('UPSERT');
  const [dragActive, setDragActive] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      showToast('Format file harus .xlsx, .xls, atau .csv', 'error');
      return;
    }
    setSelectedFile(file);
    setIsProcessing(true);
    try {
      const parsed = await parseItemsExcelFile(file, existingItems);
      setPreviewData(parsed);
    } catch (err: any) {
      showToast(err || 'Gagal membaca file Excel', 'error');
      setSelectedFile(null);
      setPreviewData(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = () => {
    if (!previewData || previewData.itemsToSave.length === 0) {
      showToast('Tidak ada data barang yang dapat diimport', 'error');
      return;
    }

    onImportComplete(previewData.itemsToSave, importMode);
    onClose();
  };

  const resetState = () => {
    setSelectedFile(null);
    setPreviewData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredDetails = previewData?.details.filter(
    d => d.name.toLowerCase().includes(searchFilter.toLowerCase()) || d.sku.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden border border-slate-200 shadow-2xl relative">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl border border-blue-200">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Import Pricelist Barang via Excel</h3>
              <p className="text-xs text-slate-500">Upload file Excel untuk pembaruan masif atau pendaftaran barang baru</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Step 1: Template Download Banner */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-blue-900">Belum memiliki format file Excel?</p>
                <p className="text-[11px] text-blue-700">Unduh template standar SRA lengkap dengan contoh tier harga dan petunjuk pengisian.</p>
              </div>
            </div>
            <button
              onClick={downloadItemExcelTemplate}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4" /> Unduh Template Excel
            </button>
          </div>

          {/* Upload Dropzone */}
          {!previewData && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/60 scale-[0.99]'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
              <div className="p-4 bg-white rounded-2xl text-blue-600 mb-3 border border-slate-200 shadow-xs">
                <Upload className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-900 mb-1">
                {isProcessing ? 'Membaca dan memproses file Excel...' : 'Tarik & Lepas File Excel di Sini'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                Mendukung file format <span className="text-slate-700 font-mono">.xlsx</span>, <span className="text-slate-700 font-mono">.xls</span>, atau <span className="text-slate-700 font-mono">.csv</span>
              </p>
              <span className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs">
                Pilih File dari Komputer
              </span>
            </div>
          )}

          {/* Preview & Confirmation Step */}
          {previewData && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* File Info & Reset */}
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900">{selectedFile?.name}</span>
                  <span className="text-slate-400">({(selectedFile?.size ? selectedFile.size / 1024 : 0).toFixed(1)} KB)</span>
                </div>
                <button
                  onClick={resetState}
                  className="text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Pilih File Lain
                </button>
              </div>

              {/* Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-bold text-blue-700">Total Baris</p>
                  <p className="text-lg font-extrabold text-blue-900 tabular-nums">{previewData.totalRowsParsed}</p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-bold text-emerald-700">Barang Baru</p>
                  <p className="text-lg font-extrabold text-emerald-900 tabular-nums">{previewData.newCount}</p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-bold text-amber-700">Update Data Lama</p>
                  <p className="text-lg font-extrabold text-amber-900 tabular-nums">{previewData.updateCount}</p>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-bold text-red-700">Diabaikan</p>
                  <p className="text-lg font-extrabold text-red-900 tabular-nums">{previewData.invalidCount}</p>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <p className="text-xs font-bold text-slate-800">Pilih Metode Impor Database:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label
                    onClick={() => setImportMode('UPSERT')}
                    className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2 transition-all ${
                      importMode === 'UPSERT'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input type="radio" checked={importMode === 'UPSERT'} onChange={() => {}} className="mt-0.5" />
                    <div>
                      <p className="font-bold">Update & Tambah</p>
                      <p className="text-[10px] text-slate-500 font-normal">Perbarui barang lama jika SKU sama, dan tambah barang baru.</p>
                    </div>
                  </label>

                  <label
                    onClick={() => setImportMode('ADD_ONLY')}
                    className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2 transition-all ${
                      importMode === 'ADD_ONLY'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input type="radio" checked={importMode === 'ADD_ONLY'} onChange={() => {}} className="mt-0.5" />
                    <div>
                      <p className="font-bold">Hanya Tambah Baru</p>
                      <p className="text-[10px] text-slate-500 font-normal">Hanya tambah SKU baru, abaikan barang yang sudah ada.</p>
                    </div>
                  </label>

                  <label
                    onClick={() => setImportMode('REPLACE')}
                    className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2 transition-all ${
                      importMode === 'REPLACE'
                        ? 'bg-red-50 border-red-500 text-red-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input type="radio" checked={importMode === 'REPLACE'} onChange={() => {}} className="mt-0.5" />
                    <div>
                      <p className="font-bold text-red-700">Ganti Seluruh Data</p>
                      <p className="text-[10px] text-slate-500 font-normal">Hapus pricelist lama dan ganti penuh dengan file ini.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-slate-700">Pratinjau Hasil Impor ({filteredDetails?.length} Barang):</p>
                  <input
                    type="text"
                    placeholder="Filter SKU / Nama..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs w-48 text-slate-800"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 sticky top-0 backdrop-blur-md text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 font-bold">Status</th>
                        <th className="p-2.5 font-bold">SKU</th>
                        <th className="p-2.5 font-bold">Nama Barang</th>
                        <th className="p-2.5 font-bold">Kategori / Unit</th>
                        <th className="p-2.5 font-bold">Tier Harga (Qty & Price)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredDetails?.map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2.5">
                            {d.status === 'NEW' && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                                BARU
                              </span>
                            )}
                            {d.status === 'UPDATE' && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-bold">
                                UPDATE
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-900">{d.sku}</td>
                          <td className="p-2.5 font-semibold text-blue-900">{d.name}</td>
                          <td className="p-2.5 text-slate-500">{d.category || '-'} ({d.unit || 'Pcs'})</td>
                          <td className="p-2.5 space-y-0.5">
                            {d.tiers.map((t, tIdx) => (
                              <div key={tIdx} className="text-[11px] text-slate-700 flex items-center gap-2">
                                <span className="text-slate-500">{t.min}-{t.max > 99999 ? '∞' : t.max}:</span>
                                <span className="font-bold text-emerald-700">{formatIDR(t.price)}</span>
                              </div>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold shadow-2xs"
          >
            Batal
          </button>

          {previewData && (
            <button
              onClick={handleExecuteImport}
              className="px-5 py-2.5 primary-button text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm"
            >
              Proses Impor ({previewData.itemsToSave.length} Barang) <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
