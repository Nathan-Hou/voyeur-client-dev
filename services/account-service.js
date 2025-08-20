import axios from "axios";
const BASIC_API = process.env.NEXT_PUBLIC_API_BASE_URL + "/Account";

class AccountService {
    login(data) {
        const { encodedEmail, encodedPassword } = data;
        return axios.post(`${BASIC_API}/Login?email=${encodedEmail}&abcd=${encodedPassword}`);
    }

    getVerifyCode(email) {
        return axios.post(`${BASIC_API}/GetVerifyCode`, {
            email
        });
    }

    register(data) {
        const { encodedEmail, encodedPassword, encodedConfirmedPassword, name, channelID } = data;
        return axios.post(`${BASIC_API}/Register?email=${encodedEmail}&pKey=${encodedPassword}&pKeyConfirm=${encodedConfirmedPassword}&name=${name}&channelID=${channelID}`);
    }

    forgotPassword(email) {
        return axios.post(`${BASIC_API}/ForgetPassword`, {
            email
        });
    }

    resetPassword(password, token) {
        return axios.post(`${BASIC_API}/ResetPassword`, {
            token,
            newPKey: password,
            newPKeyConfirm: password
        });
    }

    search(videoId) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.post(`${BASIC_API}/Search`, 
            {
                videoId,
                "pageRequestParameter": {
                    "isReturnAllDataAndNoPage": true
                }
            }, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }

    // create(sectionId, youtubeId, sort = 99999) {
    //     let token;
    //     JSON.parse(localStorage.getItem("admin_token"))
    //     ? token = JSON.parse(localStorage.getItem("admin_token")).token
    //     : token = "";

    //     return axios.post(`${BASIC_API}`, {
    //         sectionId,
    //         youtubeId,
    //         sort,
    //     }, {
    //         headers: {Authorization: `Bearer ${token}`}
    //     });
    // }

    getDetails() {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.get(`${BASIC_API}`, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }

    update(data) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.post(`${BASIC_API}/Update`, 
            data, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }

    uploadImage(formData) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.post(`${BASIC_API}/ProfilePicture`,
            formData, {
                headers: {Authorization: `Bearer ${token}`}
            }
        );
    }

    deleteImage() {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.delete(`${BASIC_API}/ProfilePicture`,
            {
                headers: {Authorization: `Bearer ${token}`}
            }
        );
    }

    getMyPayments(searchProject = "") {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.get(`${BASIC_API}/MyPayments?projectSlug=${searchProject}`, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }
}

const NewAccountService = new AccountService();
export default NewAccountService;