import React, { useState, useEffect } from 'react';
import { AssistantFormState, AssistantType, LawFirmService, CompanyService } from '../types';
import FileUploader from './FileUploader';
import { ArrowRight, Loader2 } from 'lucide-react';

interface AssistantFormProps {
  onSubmit: (data: AssistantFormState) => void;
  isLoading: boolean;
}

const AssistantForm: React.FC<AssistantFormProps> = ({ onSubmit, isLoading }) => {
  const [entityType, setEntityType] = useState<AssistantType>(AssistantType.LawFirm);
  const [serviceType, setServiceType] = useState<string>(LawFirmService.DraftLetter);
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  // Update service options when entity type changes
  useEffect(() => {
    if (entityType === AssistantType.LawFirm) {
      setServiceType(LawFirmService.DraftLetter);
    } else {
      setServiceType(CompanyService.ContractReview);
    }
  }, [entityType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    onSubmit({ entityType, serviceType, description, files });
  };

  const getPlaceholder = () => {
    if (entityType === AssistantType.LawFirm) {
      if (serviceType === LawFirmService.LegalProvisions) {
        return "请输入您想查询的法律关键词（如'不可抗力'）、具体的法律名称、或您遇到的法律疑问，我将为您检索相关法条...";
      }
      if (serviceType === LawFirmService.DraftLetter) {
        return "请详细描述律师函的发送对象、对方的违约或侵权事实、您的具体诉求（如赔偿金额、截止日期）以及希望达到的法律效果...";
      }
    }
    if (entityType === AssistantType.Company && serviceType === CompanyService.ContractReview) {
      return "请上传合同文件，并描述合同背景、您方在交易中的地位（甲方/乙方），以及您最担心的风险点...";
    }
    return "请详细描述您的具体法律需求，例如背景情况、核心问题以及您希望得到的帮助...";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">服务对象类型</label>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setEntityType(AssistantType.LawFirm)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              entityType === AssistantType.LawFirm
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            律所 / 个人
          </button>
          <button
            type="button"
            onClick={() => setEntityType(AssistantType.Company)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
              entityType === AssistantType.Company
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            公司 / 企业
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">具体业务类型</label>
        <select
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
          className="w-full rounded-lg border-slate-300 shadow-sm focus:border-jinwu-500 focus:ring focus:ring-jinwu-200 focus:ring-opacity-50 p-3 bg-white text-slate-900"
        >
          {entityType === AssistantType.LawFirm ? (
            Object.values(LawFirmService).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))
          ) : (
            Object.values(CompanyService).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))
          )}
        </select>
      </div>

      <div className="space-y-3">
        <label htmlFor="assist-desc" className="block text-sm font-medium text-slate-700">需求详情</label>
        <textarea
          id="assist-desc"
          rows={6}
          className="w-full rounded-lg border-slate-300 shadow-sm focus:border-jinwu-500 focus:ring focus:ring-jinwu-200 focus:ring-opacity-50 p-3 bg-white text-slate-900 placeholder:text-slate-400"
          placeholder={getPlaceholder()}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        ></textarea>
      </div>

      <FileUploader files={files} onFilesChange={setFiles} />

      <button
        type="submit"
        disabled={isLoading || !description.trim()}
        className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium shadow-lg shadow-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            金乌助手正在处理...
          </>
        ) : (
          <>
            开始处理
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
};

export default AssistantForm;