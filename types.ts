export enum AppMode {
  Litigation = 'LITIGATION',
  Assistant = 'ASSISTANT'
}

export enum LitigationRole {
  Plaintiff = '原告',
  Defendant = '被告'
}

export enum AssistantType {
  LawFirm = '律所',
  Company = '公司'
}

export enum LawFirmService {
  DraftLetter = '拟定律师函',
  LegalProvisions = '法律条文查询',
  CaseAnalysis = '案情分析',
  LitigationStrategy = '诉讼策略',
  LegalOpinion = '法律意见书'
}

export enum CompanyService {
  ContractReview = '合同审核',
  RiskAssessment = '合规风险评估',
  LaborDispute = '劳资纠纷处理',
  IPProtection = '知识产权保护',
  CorporateGovernance = '公司治理'
}

export interface LitigationFormState {
  role: LitigationRole;
  description: string;
  files: File[];
  checkWinRate: boolean;
}

export interface AssistantFormState {
  entityType: AssistantType;
  serviceType: string; // LawFirmService | CompanyService
  description: string;
  files: File[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  isError?: boolean;
  timestamp: number;
}
