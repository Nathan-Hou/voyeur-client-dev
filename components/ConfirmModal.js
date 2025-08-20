import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, isDeleting, title, content, cancelBtn = "取消", confirmBtn }) => {
    if (!isOpen) return null;

    return (
        // 背景遮罩
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Modal 內容 */}
            <div 
                className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold mb-4">{title}</h3>
                <p className="text-gray-600 mb-6">{content}</p>
                
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className={`px-3 py-1.5 rounded-full font-medium transition duration-200 ${
                            isDeleting
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {cancelBtn}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className={`px-3 py-1.5 rounded-full font-medium transition duration-200 ${
                            isDeleting
                                ? 'bg-red-400 text-white cursor-not-allowed'
                                : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                    >
                        {isDeleting ? `${confirmBtn}中...` : confirmBtn}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;