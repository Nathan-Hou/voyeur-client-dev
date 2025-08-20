import axios from "axios";
const BASIC_API = process.env.NEXT_PUBLIC_API_BASE_URL + "/Account";

class OAuthService {
    loginByGoogle(googleToken) {
        return axios.post(`${BASIC_API}/GoogleLogin`, 
            {
                idToken: googleToken
            }
        );
    }

    loginByFacebook(googleToken) {
        return axios.post(`${BASIC_API}/LoginByGoogle.ashx`, 
            {
                googleToken
            }
        );
    }
}

const NewOAuthService = new OAuthService();
export default NewOAuthService;