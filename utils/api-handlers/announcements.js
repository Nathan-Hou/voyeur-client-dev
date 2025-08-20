// 公告列表
export const ANNOUNCEMENTS_LIST_STATUS_MESSAGES = {
    "0": null, // 成功狀態不需要顯示錯誤訊息
    "401": "請先登入或註冊",
    "1000": "公告查詢失敗，請稍後再試",
    "default": "發生問題，請稍後再試"
};

// 公告細節
export const ANNOUNCEMENTS_DETAILS_STATUS_MESSAGES = {
    "0": null, // 成功狀態不需要顯示錯誤訊息
    "401": "請先登入或註冊",
    "1000": "查無此公告",
    "default": "發生問題，請稍後再試"
};


export const ERROR_REDIRECT_STATUS = ["401"]; // 需要重定向的錯誤狀態
