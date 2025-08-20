import axios from "axios";
const BASIC_API = process.env.NEXT_PUBLIC_API_BASE_URL + "/Member/VideoManagement";

class VideoManagementService {
    search(requestBody, page) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.post(`${BASIC_API}/Search`, 
            {
                ...requestBody,
                "pageRequestParameter": {
                    "isReturnAllDataAndNoPage": false,
                    "targetPage": page,
                    "showCount": 5
                }
            }, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }

    create(name) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.post(`${BASIC_API}`, {
            name,
            isEnabled: false,
        }, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }

    getDetails(videoId) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.get(`${BASIC_API}/${videoId}`, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }

    // batchUpdate(sectionId, youtubeDatas) {
    //     let token;
    //     JSON.parse(localStorage.getItem("admin_token"))
    //     ? token = JSON.parse(localStorage.getItem("admin_token")).token
    //     : token = "";

    //     return axios.post(`${BASIC_API}/BatchEdit`, {
    //         sectionId,
    //         youtubeDatas
    //     }, {
    //         headers: {Authorization: `Bearer ${token}`}
    //     });
    // }

    update(videoId, data) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.put(`${BASIC_API}/${videoId}`, 
            data, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }


    delete(cameraId) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.delete(`${BASIC_API}/${cameraId}`, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }


    uploadImage(videoId, formData) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.post(`${BASIC_API}/HeaderImage/${videoId}`,
            formData, {
                headers: {Authorization: `Bearer ${token}`}
            }
        );
    }

    deleteImage(videoId) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.delete(`${BASIC_API}/HeaderImage/${videoId}`,
            {
                headers: {Authorization: `Bearer ${token}`}
            }
        );
    }

}

const NewVideoManagementService = new VideoManagementService();
export default NewVideoManagementService;