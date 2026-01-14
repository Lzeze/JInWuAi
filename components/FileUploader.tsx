import React, { useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';

interface FileUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ files, onFilesChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      onFilesChange([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">相关文件 / 证据材料</label>
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-jinwu-500 hover:bg-jinwu-50 transition-colors"
      >
        <Upload className="w-8 h-8 text-slate-400 mb-2" />
        <p className="text-sm text-slate-500">点击上传文件 (支持图片、PDF等)</p>
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="w-4 h-4 text-jinwu-600 flex-shrink-0" />
                <span className="text-sm text-slate-700 truncate">{file.name}</span>
                <span className="text-xs text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
              </div>
              <button 
                onClick={() => removeFile(index)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
