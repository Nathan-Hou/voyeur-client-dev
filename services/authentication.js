import axios from "axios";
const BASIC_API = process.env.NEXT_PUBLIC_BASIC_API + "/Account";

class AuthService {
    getCurrentUser() {
        let token;
        JSON.parse(localStorage.getItem("biodnd_chatbot_user"))
        ? token = JSON.parse(localStorage.getItem("biodnd_chatbot_user")).token
        : token = "";

        return axios.get(`${BASIC_API}`, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }

    // logout() {
    //     localStorage.clear();
    // }

    login() {
        let token;
        if (JSON.parse(localStorage.getItem("auth_token"))) {
            token = JSON.parse(localStorage.getItem("auth_token")).token;
        } else {
            token = "";
        }

        return axios.post(`${BASIC_API}/Login?email=${encodedEmail}&abcd=${encodedPassword}`);
    }
}

const NewAuthService = new AuthService();
export default NewAuthService;