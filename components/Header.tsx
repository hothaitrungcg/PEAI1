import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-blue-800 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-50">
      <div className="flex flex-col">
        <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wide">
          ỨNG DỤNG TRÍ TUỆ NHÂN TẠO PHÂN TÍCH KỸ THUẬT ĐỘNG TÁC
        </h1>
        <div className="flex flex-col md:flex-row md:gap-8 mt-2 text-sm md:text-base text-blue-100">
          <p><span className="font-semibold">Bộ môn:</span> Bóng Ném</p>
          <p><span className="font-semibold">Giáo viên phụ trách:</span> Hồ Thái Trung</p>
        </div>
      </div>
      <div className="flex-shrink-0 ml-4 bg-white p-1 rounded-lg">
        {/* Using the Drive ID provided: 1kY7oBYphDj35LHNN4jRLNZ2EqQYHk2Sw */}
        {/* Using a direct proxy link for Google Drive images often fails due to CORS/Permissions. 
            Falling back to a placeholder if it fails, but attempting a direct construct first. 
            Since real Drive links are tricky without API, I will use a high-quality placeholder 
            that represents a school logo, but keep the alt tag accurate. */}
        <img 
          src="https://lh3.googleusercontent.com/d/1kY7oBYphDj35LHNN4jRLNZ2EqQYHk2Sw" 
          onError={(e) => {
            e.currentTarget.src = "https://ui-avatars.com/api/?name=Logo&background=random&size=128";
          }}
          alt="Logo Trường" 
          className="h-16 w-16 md:h-20 md:w-20 object-contain"
        />
      </div>
    </header>
  );
};

export default Header;