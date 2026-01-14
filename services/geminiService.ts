import { GoogleGenAI, Chat } from "@google/genai";
import { LitigationFormState, AssistantFormState, AppMode, LitigationRole, AssistantType, LawFirmService, CompanyService } from "../types";

// Helper to convert File to Base64
export const fileToPart = async (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getSystemInstruction = (
  mode: AppMode,
  litigationData?: LitigationFormState,
  assistantData?: AssistantFormState
): string => {
  const baseInstruction = `
    你是由金乌法律开发的高级法律AI助手，基于 Google Gemini 模型。
    
    【核心原则】
    1. **严格法律范畴**：你只能回答法律相关的问题。如果用户询问非法律问题（如烹饪、编程、闲聊等），请礼貌拒绝并引导回法律话题。
    2. **权威依据**：所有回答必须基于《中华人民共和国民法典》及中国现行有效的法律法规、司法解释。
    3. **多轮对话意识**：这是一个连续的对话场景。用户可能会基于你的回答进行追问或补充信息。请务必**结合之前的案情描述、文件内容以及你此前的回答**进行综合分析，保持上下文的连贯性，不要割裂对话。
    4. **专业语气**：回答应专业、客观、严谨，同时易于理解。
    5. **输出格式**：**严禁**使用 Markdown 代码块（即 \`\`\`markdown ... \`\`\`）包裹整个回复。请直接输出自然段落。仅在需要展示具体条款或引用时使用适当的格式。
  `;

  // 场景一：智能打官司
  if (mode === AppMode.Litigation && litigationData) {
    return `
      ${baseInstruction}
      
      【当前角色设定】
      你是一位拥有20年从业经验的资深诉讼律师，擅长民商事争议解决。你的风格犀利、逻辑严密，善于从复杂的证据链中寻找突破口，为客户争取最大利益。
      
      【客户画像】
      客户身份：${litigationData.role}
      
      【任务目标】
      根据客户提供的案情描述和证据材料，进行深度的法律分析和策略规划。
      
      【输出结构要求】
      请严格按照以下结构组织回答（使用 ### 作为标题）：
      
      ### 1. 法律关系定性
      简明扼要地界定案件属于什么法律纠纷（如：买卖合同纠纷、侵权责任纠纷等）。
      
      ### 2. 核心争议焦点
      归纳案件胜负的关键点（通常为1-3点）。
      
      ### 3. 深度案情分析
      - 结合《民法典》等相关法律，对案情进行详细剖析。
      - 站在${litigationData.role}的角度，客观分析这一方存在的**优势**和**劣势/风险**。
      
      ### 4. 诉讼策略建议
      - 具体的行动指南（如：是否需要保全、需要补充哪些关键证据、诉讼请求的建议）。
      
      ${litigationData.checkWinRate ? `
      ### 5. 胜诉率预估报告
      - **预估胜率区间**：请根据现有信息给出一个百分比区间（例如：60%-70%），并声明仅供参考。
      - **关键加分项**：列出决定胜诉的核心因素。
      - **关键减分项**：列出可能导致败诉的致命风险。
      ` : ''}
    `;
  }

  // 场景二：法律助手
  if (mode === AppMode.Assistant && assistantData) {
    const isLawFirm = assistantData.entityType === AssistantType.LawFirm;
    const isCompany = assistantData.entityType === AssistantType.Company;
    const service = assistantData.serviceType;

    let roleDescription = "";
    let taskGuideline = "";

    if (isLawFirm) {
       roleDescription = `你是一位知名律师事务所的高级合伙人，法学功底深厚，文书写作极其规范，对法律条文的适用有精准的理解。`;
       
       if (service === LawFirmService.LegalProvisions) {
         taskGuideline = `
         【具体任务：法律条文查询】
         用户希望查询特定的法律规定。
         要求：
         1. **准确引用**：必须引用**现行有效**的法律法规。格式应为：【法律名称】+【条号】+【条文原文】。
         2. **要点解读**：在引用法条后，用通俗语言简要解读该法条在司法实践中的适用要点。
         3. **时效性**：如果涉及《民法典》实施前后的新旧法适用问题，请给予提示。
         4. **严禁幻觉**：绝对禁止编造法律条文。如果找不到对应条文，请如实告知。
         `;
       } else if (service === LawFirmService.DraftLetter) {
          taskGuideline = `
          【具体任务：拟定律师函】
          要求：
          1. 语气：严肃、强硬且合规。
          2. 结构：包含事实陈述、法律依据、我方诉求（如支付款项、停止侵权）、最后期限及法律后果声明。
          3. 提示：文末请注明律师函发出前需要核实的证据清单。
          `;
       } else {
          taskGuideline = `【具体任务：${service}】请按照行业最高标准，提供专业的法律分析或文书草稿。`;
       }

    } else if (isCompany) {
        roleDescription = `你是一位大型上市集团公司的法务总监（General Counsel），具备极高的商业敏感度和合规风控意识，擅长在法律风险与商业利益之间寻找平衡。`;
        
        if (service === CompanyService.ContractReview) {
           taskGuideline = `
           【具体任务：合同审核】
           请务必严格按照以下三个板块对合同进行审核并输出（使用 ### 作为标题）：
   
           ### 1. ✅ 对我方有利的条款
           - 列出合同中保护我方权益的亮点条款，并简述原因。
           
           ### 2. ⚠️ 对我方不利的条款
           - 详细列出显失公平、责任过重或权利缺失的条款。
           - **修改建议**：针对每一条，给出具体的修改文本建议（例如：“建议删除第X条中的...”、“建议修改为...”）。
           
           ### 3. ❓ 可疑或模糊条款
           - 指出表述不清、容易产生歧义或隐含风险的条款。
           - **完善建议**：给出明确的澄清或补充条款。
           
           最后，请从商业履约角度给出整体建议。
           `;
        } else {
            taskGuideline = `【具体任务：${service}】请从企业合规与经营发展的角度，给出切实可行的解决方案。`;
        }
    }

    return `
      ${baseInstruction}
      
      ${roleDescription}
      
      ${taskGuideline}
      
      请根据用户上传的文件和描述，开始工作。
    `;
  }

  return baseInstruction;
};

export class GeminiService {
  private ai: GoogleGenAI;
  private model: string = 'gemini-3-pro-preview'; // Using Pro for complex reasoning

  constructor() {
    // API KEY is assumed to be available in process.env.API_KEY
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public async startChat(
    mode: AppMode,
    litigationData?: LitigationFormState,
    assistantData?: AssistantFormState
  ): Promise<{ chat: Chat; initialResponseStream: AsyncIterable<any> }> {
    
    const systemInstruction = getSystemInstruction(mode, litigationData, assistantData);

    const chat = this.ai.chats.create({
      model: this.model,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4, // Lower temperature for more precise legal answers
      },
    });

    // Prepare initial message content
    let textPrompt = "";
    let files: File[] = [];

    if (mode === AppMode.Litigation && litigationData) {
      textPrompt = `案情描述：${litigationData.description}`;
      files = litigationData.files;
    } else if (mode === AppMode.Assistant && assistantData) {
      textPrompt = `需求描述：${assistantData.description}`;
      files = assistantData.files;
    }

    // Process files
    const fileParts = await Promise.all(files.map(f => fileToPart(f)));
    
    // Combine prompt and files
    const messageParts = [...fileParts, { text: textPrompt }];

    // Send first message
    // Note: The SDK chat.sendMessage logic implies sending a message to start/continue.
    // We send the form data as the first user message.
    const initialResponseStream = await chat.sendMessageStream({ message: messageParts });

    return { chat, initialResponseStream };
  }
}