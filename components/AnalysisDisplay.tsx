import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, EvaluationStatus, PhaseAnalysis, AnalysisPoint } from '../types';
import { Volume2, Download, AlertTriangle, Zap, CheckCircle2, Clock, Activity } from 'lucide-react';

interface AnalysisDisplayProps {
  result: AnalysisResult | null;
  loading: boolean;
  onSpeak: (text?: string) => void;
  onExport: () => void;
  onReset: () => void;
  mediaUrl?: string | null;
}

// Helper component to extract and display a frame from video at a specific timestamp
const VideoSnapshot: React.FC<{ videoUrl: string, timestamp: string, label: string, type: 'error' | 'success' }> = ({ videoUrl, timestamp, label, type }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!videoUrl || !timestamp) return;

    // Parse timestamp "MM:SS" to seconds
    const parts = timestamp.split(':');
    let seconds = 0;
    if (parts.length === 2) {
      seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else {
      seconds = parseInt(timestamp); // Fallback if just seconds
    }

    const video = videoRef.current;
    if (video) {
      video.currentTime = seconds;
    }
  }, [videoUrl, timestamp]);

  const handleSeeked = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setImageSrc(canvas.toDataURL('image/jpeg'));
      }
    }
  };

  return (
    <div className="relative rounded-lg overflow-hidden h-32 bg-gray-900 border border-gray-200 group">
      {/* Hidden video for processing */}
      <video 
        ref={videoRef} 
        src={videoUrl} 
        crossOrigin="anonymous"
        className="hidden" 
        onSeeked={handleSeeked}
        onLoadedData={() => {
             // Trigger initial seek if needed, usually handled by useEffect
             const parts = timestamp.split(':');
             let seconds = 0;
             if (parts.length === 2) seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
             if(videoRef.current) videoRef.current.currentTime = seconds;
        }}
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Display captured image or placeholder */}
      {imageSrc ? (
        <img src={imageSrc} className="w-full h-full object-cover" alt={label} />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
           Loading...
        </div>
      )}
      
      <div className={`absolute top-2 left-2 ${type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1`}>
        <span>{label}</span>
        <span className="bg-black/20 px-1 rounded text-[10px] flex items-center gap-0.5">
           <Clock size={8} /> {timestamp}
        </span>
      </div>
    </div>
  );
};

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ 
  result, 
  loading, 
  onSpeak, 
  onExport, 
  onReset,
  mediaUrl
}) => {
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col items-center justify-center p-10">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium text-gray-600 animate-pulse">Đang phân tích kỹ thuật...</p>
        <p className="text-sm text-gray-400 mt-2">AI đang chấm điểm, tìm lỗi và trích xuất hình ảnh...</p>
      </div>
    );
  }

  if (!result || !result.data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col items-center justify-center p-10 text-center">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <Zap size={48} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">Chưa có dữ liệu phân tích</h3>
        <p className="text-gray-500">Vui lòng tải lên hình ảnh hoặc video để xem báo cáo chi tiết.</p>
      </div>
    );
  }

  const { data } = result;
  const isVideo = mediaUrl?.includes('blob:'); // Simplified check, ideally pass mimeType

  const getScoreColor = (score: number) => {
    if (score >= 8.0) return 'bg-green-600';
    if (score >= 5.0) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden font-sans">
      
      {/* Report Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-10 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 uppercase leading-tight">BÁO CÁO PHÂN TÍCH KỸ THUẬT</h2>
          <p className="text-xs font-bold text-red-700 tracking-wider">Chuyên gia AI</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onSpeak()} // Calls without args to trigger "Summary + Conclusion" mode
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition text-sm font-semibold"
          >
            <Volume2 size={16} />
            Nghe chuyên gia phân tích
          </button>
          <button 
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition text-sm font-semibold"
          >
            <Download size={16} />
            Xuất
          </button>
        </div>
      </div>

      <div className="flex-grow p-4 md:p-6 overflow-y-auto space-y-6 bg-gray-50">
        
        {/* General Assessment Box (Previously Summary Quote) */}
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-5 rounded-r-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-indigo-600" size={20} />
            <h3 className="text-indigo-800 font-bold uppercase text-sm">NHẬN XÉT QUÁ TRÌNH THỰC HIỆN:</h3>
          </div>
          <p className="text-indigo-900 font-medium text-lg leading-relaxed text-justify">
            {data.summaryQuote}
          </p>
        </div>

        {/* Phases Loop */}
        {data.phases.map((phase, index) => {
          // Construct the full text for this phase to be read
          const phaseFullText = `
            ${phase.phaseName}. Điểm số ${phase.score} trên 10.
            ${phase.assessment}
            ${phase.correctPoints.length > 0 ? 'Những điểm bạn đã làm tốt là: ' + phase.correctPoints.map(p => p.description).join('. ') + '.' : ''}
            ${phase.errors.length > 0 ? 'Tuy nhiên, có một số lỗi cần sửa: ' + phase.errors.map(e => e.description).join('. ') + '.' : ''}
            Lời khuyên: ${phase.improvement}
          `;

          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Phase Header */}
              <div className="p-4 flex justify-between items-center bg-white border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-blue-900 font-bold text-lg uppercase">{phase.phaseName}</h3>
                  <button 
                    onClick={() => onSpeak(phaseFullText)} 
                    className="text-blue-400 hover:text-blue-600"
                    title="Nghe toàn bộ giai đoạn này"
                  >
                    <Volume2 size={18} />
                  </button>
                </div>
                <div className={`${getScoreColor(phase.score)} text-white font-bold text-xl px-3 py-1 rounded-md shadow-sm`}>
                  {phase.score}/10
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Assessment Text */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Đánh giá từ AI:</p>
                  <p className="text-gray-800 font-medium leading-relaxed">{phase.assessment}</p>
                </div>

                {/* Correct Points Section */}
                {phase.correctPoints.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <p className="text-xs font-bold text-green-800 uppercase mb-2 flex items-center gap-2">
                      <CheckCircle2 size={16} /> ĐIỂM THỰC HIỆN TỐT:
                    </p>
                    <ul className="space-y-1 mb-3">
                      {phase.correctPoints.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2 text-green-900 text-sm font-medium">
                          <CheckCircle2 size={14} className="mt-1 flex-shrink-0 text-green-500" />
                          <span>{pt.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Error Box */}
                {phase.errors.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                    <p className="text-xs font-bold text-red-800 uppercase mb-2">LỖI CẦN SỬA (NHẤN LOA ĐỂ NGHE):</p>
                    <ul className="space-y-2">
                      {phase.errors.map((err, i) => (
                        <li key={i} className="flex items-start gap-2 text-red-900 font-medium">
                          <AlertTriangle size={16} className="mt-1 flex-shrink-0 text-red-500" />
                          <span className="flex-grow">{err.description}</span>
                          <button onClick={() => onSpeak(err.description)} className="text-red-400 hover:text-red-700">
                            <Volume2 size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Evidence Images */}
                {mediaUrl && (phase.errors.length > 0 || phase.correctPoints.length > 0) && (
                  <div>
                    <p className="text-xs font-bold text-gray-800 uppercase mb-2">BẰNG CHỨNG HÌNH ẢNH TRÍCH XUẤT TỪ VIDEO:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                       {/* Render Error Thumbnails */}
                       {phase.errors.map((err, i) => (
                         <div key={`err-${i}`}>
                           {isVideo ? (
                             <VideoSnapshot 
                                videoUrl={mediaUrl} 
                                timestamp={err.timestamp} 
                                label={`LỖI #${i+1}`} 
                                type="error"
                             />
                           ) : (
                             // Fallback for image input (no timestamp seeking)
                             <div className="relative rounded-lg overflow-hidden h-32 bg-gray-900 border border-gray-200">
                                <img src={mediaUrl} className="w-full h-full object-cover opacity-90" alt="evidence" />
                                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm">
                                  LỖI #{i+1}
                                </div>
                             </div>
                           )}
                         </div>
                       ))}
                       
                       {/* Render Correct Point Thumbnails (Limit to 1 to save space if needed, or show all) */}
                       {phase.correctPoints.slice(0, 1).map((pt, i) => (
                         <div key={`good-${i}`}>
                           {isVideo ? (
                             <VideoSnapshot 
                                videoUrl={mediaUrl} 
                                timestamp={pt.timestamp} 
                                label={`ĐÚNG #${i+1}`} 
                                type="success"
                             />
                           ) : null}
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* Improvement Box */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-xs font-bold text-blue-800 uppercase mb-1">ĐỀ XUẤT CẢI THIỆN:</p>
                  <p className="text-blue-900 font-medium text-sm leading-relaxed">
                    {phase.improvement}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Total Summary */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-yellow-600 fill-current" size={20} />
            <h3 className="text-yellow-800 font-bold uppercase text-lg">TỔNG KẾT & LỜI KHUYÊN</h3>
          </div>
          <p className="text-gray-800 font-medium leading-relaxed">
            {data.overallAdvice}
          </p>
          <div className="mt-4 pt-4 border-t border-yellow-200 flex justify-between items-center">
             <span className="text-sm font-semibold text-gray-500">ĐÁNH GIÁ CHUNG:</span>
             <span className={`px-4 py-1.5 rounded-full text-white font-bold text-sm ${
               data.evaluation === 'Hoàn thành tốt' ? 'bg-green-600' : 
               data.evaluation === 'Hoàn thành' ? 'bg-blue-600' : 'bg-gray-500'
             }`}>
               {data.evaluation.toUpperCase()}
             </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalysisDisplay;