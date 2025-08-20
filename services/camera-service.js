import axios from "axios";
const BASIC_API = process.env.NEXT_PUBLIC_API_BASE_URL + "/Member/VideoCameraManagement";

class CameraService {
    search() {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.post(`${BASIC_API}/Search`, 
            {
                "pageRequestParameter": {
                    "isReturnAllDataAndNoPage": true
                }
            }, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }

    create(videoId, youtubeId, sort = 99999) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.post(`${BASIC_API}`, {
            videoId,
            youtubeId,
            sort,
        }, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }

    // getDetails(sectionId) {
    //     let token;
    //     JSON.parse(localStorage.getItem("admin_token"))
    //     ? token = JSON.parse(localStorage.getItem("admin_token")).token
    //     : token = "";

    //     return axios.get(`${BASIC_API}/${sectionId}`, {
    //         headers: {Authorization: `Bearer ${token}`}
    //     });
    // }

    batchUpdate(videoId, youtubeDatas) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.post(`${BASIC_API}/BatchEdit`, {
            videoId,
            youtubeDatas
        }, {
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
}

const NewCameraService = new CameraService();
export default NewCameraService;