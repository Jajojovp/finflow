import React, { useRef, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import Button from './Button';

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const row = {};
    headers.forEach((h, i) => {
      const raw = values[i]?.trim() ?? '';
      row[h] = isNaN(Number(raw)) || raw === '' ? raw : Number(raw);
    });
    return row;
  });
}

export default function CsvUploader({ onUpload }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const rows = parseCSV(e.target.result);
      if (rows.length > 0) onUpload?.(rows);
    };
    reader.readAsText(file);
  };

  const handleChange = (e) => handleFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div
      role="region"
      aria-label="CSV file upload"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 transition-colors ${
        dragOver ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleChange}
        className="hidden"
        aria-label="Upload CSV file"
      />
      {fileName ? (
        <div className="flex items-center gap-2 text-sm text-text">
          <FileText size={16} className="text-primary" />
          <span>{fileName}</span>
        </div>
      ) : (
        <p className="text-sm text-text-muted">Drag & drop a CSV file or</p>
      )}
      <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
        <Upload size={14} />
        Choose file
      </Button>
    </div>
  );
}
