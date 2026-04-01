export enum EvaluationStatus {
  EXCELLENT = 'Hoàn thành tốt',
  COMPLETE = 'Hoàn thành',
  INCOMPLETE = 'Chưa hoàn thành',
  UNKNOWN = 'Chưa đánh giá'
}

export interface AnalysisPoint {
  description: string;
  timestamp: string; // Định dạng "MM:SS", ví dụ "00:05"
}

export interface PhaseAnalysis {
  phaseName: string;
  score: number; // Thang điểm 10
  assessment: string; // Đánh giá chung
  correctPoints: AnalysisPoint[]; // Những điểm làm đúng
  errors: AnalysisPoint[]; // Danh sách lỗi cần sửa
  improvement: string; // Đề xuất cải thiện
}

export interface TechniqueAnalysis {
  summaryQuote: string; 
  phases: PhaseAnalysis[];
  overallAdvice: string;
  evaluation: EvaluationStatus;
}

export interface AnalysisResult {
  data: TechniqueAnalysis | null;
  rawText?: string;
}

export interface TechniqueStep {
  title: string;
  description: string[];
}

export interface TechniquePhase {
  name: string;
  steps: TechniqueStep[];
}