import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import TechniqueStandard from './components/TechniqueStandard';
import AnalysisDisplay from './components/AnalysisDisplay';
import { analyzeTechnique } from './services/geminiService';
import { AnalysisResult } from './types';
import html2canvas from 'html2canvas';
import { Upload, Camera, Video, Image as ImageIcon, Circle, Square, RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Camera & Recording State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const appRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Pre-load voices on mount to ensure availability
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Cleanup stream on unmount
    return () => {
      stopCameraStream();
    };
  }, []);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // --- CAMERA HANDLERS ---

  const handleEnableCamera = async () => {
    // Reset previous state
    handleReset();
    setLoading(false); // Reset loading manually as handleReset might keep it if not fully cleared
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, // Prefer back camera on mobile
        audio: true 
      });
      
      streamRef.current = stream;
      setIsCameraActive(true);
      setMediaType('video');
      
      // Allow UI to update before attaching stream
      setTimeout(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          liveVideoRef.current.play();
        }
      }, 100);

    } catch (error) {
      console.error("Camera Access Error:", error);
      alert("Không thể truy cập camera. Vui lòng cấp quyền sử dụng camera và micro.");
    }
  };

  const handleStartRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    // Prefer webm for better compatibility in browsers, fallback to mp4 if supported
    const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
      ? { mimeType: 'video/webm;codecs=vp9' } 
      : { mimeType: 'video/webm' };

    const recorder = new MediaRecorder(streamRef.current, options);
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setMediaUrl(url);
      setIsCameraActive(false); // Switch from live view to recorded view
      stopCameraStream(); // Release camera

      // Auto Analyze
      setLoading(true);
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        try {
          const result = await analyzeTechnique(base64Data, 'video/webm');
          setAnalysisResult(result);
        } catch (error) {
          alert('Có lỗi xảy ra trong quá trình phân tích video quay trực tiếp.');
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
    setRecordingTime(0);

    // Start Timer
    timerRef.current = window.setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // --- FILE UPLOAD HANDLERS ---

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset previous analysis
    stopCameraStream();
    setIsCameraActive(false);
    setAnalysisResult(null);
    setLoading(true);

    const type = file.type.startsWith('video') ? 'video' : 'image';
    setMediaType(type);
    
    // Create Object URL for preview
    const url = URL.createObjectURL(file);
    setMediaUrl(url);

    try {
      // Convert file to base64 for Gemini
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64String.split(',')[1];
        
        try {
          // Proceed to analyze immediately after input as requested
          const result = await analyzeTechnique(base64Data, file.type);
          setAnalysisResult(result);
        } catch (error) {
          alert('Có lỗi xảy ra trong quá trình phân tích. Vui lòng thử lại.');
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
    } catch (error) {
      console.error("File reading error:", error);
      setLoading(false);
    }
  };

  // --- COMMON ACTIONS ---

  // Text to Speech
  const handleSpeak = (textToRead?: string) => {
    if (!analysisResult?.data) return;
    
    let text = "";
    
    if (textToRead) {
      text = textToRead;
    } else {
      const data = analysisResult.data;
      text = `Chào bạn, đây là báo cáo phân tích từ Chuyên gia AI. 
              Nhận xét quá trình thực hiện: ${data.summaryQuote}. 
              Sau khi xem xét kỹ lưỡng, đây là tổng kết và lời khuyên dành cho bạn: ${data.overallAdvice}. 
              Đánh giá chung: ${data.evaluation}.`;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    
    let voices = window.speechSynthesis.getVoices();
    const vnVoices = voices.filter(v => v.lang.includes('vi'));
    
    const maleVoice = vnVoices.find(v => {
      const name = v.name.toLowerCase();
      return name.includes('nam') || 
             name.includes('male') || 
             name.includes('man') || 
             name.includes(' an ') || 
             name.endsWith(' an');
    });
    
    if (maleVoice) {
      utterance.voice = maleVoice;
      utterance.pitch = 1.0; 
      utterance.rate = 1.3; 
    } else if (vnVoices.length > 0) {
      utterance.voice = vnVoices[0];
      utterance.pitch = 0.6; 
      utterance.rate = 1.2; 
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleExport = async () => {
    if (!appRef.current) return;
    try {
      const canvas = await html2canvas(appRef.current, {
        useCORS: true, 
        scale: 2, 
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `phan-tich-ky-thuat-${new Date().toISOString().split('T')[0]}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Không thể xuất hình ảnh. Vui lòng thử lại.");
    }
  };

  const handleReset = () => {
    stopCameraStream();
    setMediaUrl(null);
    setMediaType(null);
    setAnalysisResult(null);
    setLoading(false);
    setIsCameraActive(false);
    setIsRecording(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    window.speechSynthesis.cancel();
  };

  return (
    <div className="min-h-screen flex flex-col" ref={appRef}>
      <Header />

      <main className="flex-grow p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto w-full">
        
        {/* LEFT COLUMN: Input & Standards */}
        <div className="flex flex-col gap-6">
          
          {/* Top: Input Section */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
             <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  onClick={(e) => (e.currentTarget.value = '')} 
                  accept="image/*,video/*" 
                  className="hidden" 
                  id="media-upload"
                  disabled={isRecording}
                />
                
                {/* Upload Button */}
                <label 
                  htmlFor="media-upload" 
                  className={`flex-1 cursor-pointer font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm ${isRecording ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                  <Upload size={20} />
                  <span>Nhập Hình ảnh / Video</span>
                </label>

                {/* Live Camera Button */}
                {!isCameraActive ? (
                  <button 
                    onClick={handleEnableCamera}
                    disabled={loading}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Camera size={20} />
                    <span>Quay Video Trực Tiếp</span>
                  </button>
                ) : (
                  <button 
                    onClick={handleReset}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <RotateCcw size={20} />
                    <span>Hủy Quay</span>
                  </button>
                )}
             </div>

             {/* Media Preview Area */}
             <div className="w-full bg-gray-900 rounded-lg overflow-hidden min-h-[250px] flex items-center justify-center relative border border-gray-800">
               
               {/* MODE 1: LIVE CAMERA */}
               {isCameraActive && (
                 <div className="relative w-full h-full flex flex-col items-center">
                   <video 
                     ref={liveVideoRef} 
                     className="w-full max-h-[400px] object-contain bg-black"
                     autoPlay 
                     muted 
                     playsInline 
                   />
                   
                   {/* Recording Overlay UI */}
                   <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2">
                     {isRecording && (
                       <div className="bg-red-600/80 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse flex items-center gap-2">
                         <div className="w-3 h-3 bg-white rounded-full"></div>
                         REC {formatTime(recordingTime)}
                       </div>
                     )}

                     {!isRecording ? (
                       <button 
                         onClick={handleStartRecording}
                         className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full shadow-lg flex items-center gap-2 transform transition hover:scale-105"
                       >
                         <Circle fill="white" className="text-white" size={20} />
                         BẮT ĐẦU QUAY
                       </button>
                     ) : (
                       <button 
                         onClick={handleStopRecording}
                         className="bg-gray-800 hover:bg-gray-900 border-2 border-white text-white font-bold py-3 px-8 rounded-full shadow-lg flex items-center gap-2 transform transition hover:scale-105"
                       >
                         <Square fill="white" className="text-white" size={20} />
                         KẾT THÚC & PHÂN TÍCH
                       </button>
                     )}
                   </div>
                 </div>
               )}

               {/* MODE 2: MEDIA PREVIEW (Uploaded or Recorded) */}
               {!isCameraActive && (
                 mediaUrl ? (
                    mediaType === 'video' ? (
                      <video 
                        src={mediaUrl} 
                        controls 
                        className="max-h-[400px] w-full object-contain" 
                        playsInline
                      />
                    ) : (
                      <img src={mediaUrl} alt="Uploaded content" className="max-h-[400px] w-full object-contain" />
                    )
                 ) : (
                   <div className="text-gray-500 flex flex-col items-center p-8">
                     <div className="flex gap-4 mb-2">
                       <ImageIcon size={32} />
                       <Video size={32} />
                     </div>
                     <p className="text-center">Chọn "Nhập Hình ảnh/Video" hoặc "Quay Video Trực Tiếp"</p>
                   </div>
                 )
               )}
             </div>
          </div>

          {/* Body: Standards */}
          <div className="flex-grow">
            <TechniqueStandard onSpeak={handleSpeak} />
          </div>

        </div>

        {/* RIGHT COLUMN: Analysis Results */}
        <div className="flex flex-col h-full">
          <AnalysisDisplay 
            result={analysisResult} 
            loading={loading}
            onSpeak={handleSpeak}
            onExport={handleExport}
            onReset={handleReset}
            mediaUrl={mediaUrl}
          />
        </div>

      </main>
    </div>
  );
};

export default App;