import React, { useState } from 'react';
import { LitigationFormState, LitigationRole } from '../types';
import FileUploader from './FileUploader';
import { ArrowRight, Loader2 } from 'lucide-react';

interface LitigationFormProps {
  onSubmit: (data: LitigationFormState) => void;
  isLoading: boolean;
}

const LitigationForm: React.FC<LitigationFormProps> = ({ onSubmit, isLoading }) => {
  const [role, setRole] = useState<LitigationRole>(LitigationRole.Plaintiff);
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [checkWinRate, setCheckWinRate] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    onSubmit({ role, description, files, checkWinRate });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">您的身份</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setRole(LitigationRole.Plaintiff)}
            className={`p-3 rounded-lg border-2 text-center transition-all ${
              role === LitigationRole.Plaintiff
                ? 'border-jinwu-500 bg-jinwu-50 text-jinwu-700 font-bold'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            原告
          </button>
          <button
            type="button"
            onClick={() => setRole(LitigationRole.Defendant)}
            className={`p-3 rounded-lg border-2 text-center transition-all ${
              role === LitigationRole.Defendant
                ? 'border-jinwu-500 bg-jinwu-50 text-jinwu-700 font-bold'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            被告
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor="desc" className="block text-sm font-medium text-slate-700">案情描述</label>
        <textarea
          id="desc"
          rows={6}
          className="w-full rounded-lg border-slate-300 shadow-sm focus:border-jinwu-500 focus:ring focus:ring-jinwu-200 focus:ring-opacity-50 p-3 bg-white text-slate-900 placeholder:text-slate-400"
          placeholder="请详细描述案件的经过、争议焦点以及您的诉求..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        ></textarea>
      </div>

      <FileUploader files={files} onFilesChange={setFiles} />

      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <input
          type="checkbox"
          id="winrate"
          checked={checkWinRate}
          onChange={(e) => setCheckWinRate(e.target.checked)}
          className="w-4 h-4 text-jinwu-600 border-gray-300 rounded focus:ring-jinwu-500"
        />
        <label htmlFor="winrate" className="text-sm text-slate-700 cursor-pointer select-none">
          请求AI分析案件胜诉率 (胜率预估)
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading || !description.trim()}
        className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium shadow-lg shadow-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            金乌正在分析案情...
          </>
        ) : (
          <>
            提交给AI律师
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
};

export default LitigationForm;