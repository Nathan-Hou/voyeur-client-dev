import axios from "axios";
const BASIC_API = process.env.NEXT_PUBLIC_API_BASE_URL;

class AnnouncementService {
    get(pageNum = 10) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.post(`${BASIC_API}/NoticeList.ashx`, 
            {
                pageNum
            }, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }
}

const NewAnnouncementService = new AnnouncementService();
export default NewAnnouncementService;