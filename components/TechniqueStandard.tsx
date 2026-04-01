import React from 'react';
import { Volume2 } from 'lucide-react';

interface TechniqueStandardProps {
  onSpeak: (text: string) => void;
}

const TechniqueStandard: React.FC<TechniqueStandardProps> = ({ onSpeak }) => {
  const standardText = `
    Tiêu chuẩn thực hiện kỹ thuật ném bóng.
    Giai đoạn 1: Tư thế chuẩn bị.
    Đứng 2 chân trước sau, rộng bằng vai, chân không thuận đặt phía trước.
    Trọng tâm dồn đều 2 chân.
    Hai tay cầm bóng trước ngực.
    Mắt nhìn về hướng Ném.
    Giai đoạn 2: Thực hiện động tác ném bóng.
    Bước 1: Xoay thân và đưa bóng lên vai.
    Từ tư thế chuẩn bị xoay thân cho vai không thuận hướng về hướng Ném.
    Hai tay phối hợp nhịp nhàng đưa bóng ra sau lên trên vai, lúc này tay thuận cầm bóng, tay trái hướng về hướng ném.
    Bước 2: Xoay hông và ném bóng.
    Thực hiện động tác xoay hông đồng thời thực hiện tác vụ Ném bóng về hướng cần Ném.
    Kết thúc bước chân sau về trước để giữ thăng bằng.
  `;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="bg-blue-100 p-3 border-b border-blue-200 flex justify-between items-center">
        <h2 className="text-lg font-bold text-blue-900 uppercase">Tiêu Chuẩn Thực Hiện</h2>
        <button 
          onClick={() => onSpeak(standardText)}
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-200 p-1.5 rounded-full transition-colors"
          title="Nghe tiêu chuẩn thực hiện"
        >
          <Volume2 size={20} />
        </button>
      </div>
      
      <div className="p-4 overflow-y-auto flex-grow text-sm text-gray-800 space-y-4">
        <section>
          <h3 className="font-bold text-blue-800 mb-1">Giai đoạn 1: Tư thế chuẩn bị</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Đứng 2 chân trước sau, rộng bằng vai, chân không thuận đặt phía trước.</li>
            <li>Trọng tâm dồn đều 2 chân.</li>
            <li>Hai tay cầm bóng trước ngực.</li>
            <li>Mắt nhìn về hướng Ném.</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-blue-800 mb-1">Giai đoạn 2: Thực hiện động tác ném bóng</h3>
          
          <div className="mb-2">
            <h4 className="font-semibold text-gray-700">Bước 1: Xoay thân và đưa bóng lên vai</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Từ tư thế chuẩn bị xoay thân cho vai không thuận hướng về hướng Ném (ném tay phải thì vai trái hướng về hướng Ném).</li>
              <li>Hai tay phối hợp nhịp nhàng đưa bóng ra sau - lên trên vai, lúc này tay thuận cầm bóng, tay trái hướng về hướng ném.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700">Bước 2: Xoay hông và ném bóng</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Thực hiện động tác xoay hông đồng thời thực hiện tác vụ Ném bóng về hướng cần Ném.</li>
              <li>Kết thúc bước chân sau về trước để giữ thăng bằng.</li>
            </ul>
          </div>
        </section>

        <div className="mt-4 border-t pt-4">
          <p className="font-semibold text-gray-600 mb-2">Hình ảnh minh họa kỹ thuật:</p>
          <div className="rounded-lg overflow-hidden border border-gray-300 bg-gray-50 flex justify-center items-center min-h-[200px]">
             {/* Using Drive ID: 1xC_gTUdYvL6v43WyNE5fe-McHeigQ_CV */}
            <img 
               src="https://lh3.googleusercontent.com/d/1xC_gTUdYvL6v43WyNE5fe-McHeigQ_CV"
               onError={(e) => {
                 // Fallback to a clear placeholder if drive link fails
                 e.currentTarget.src = "https://picsum.photos/400/300?grayscale";
               }}
               alt="Minh họa kỹ thuật ném" 
               className="max-w-full h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechniqueStandard;