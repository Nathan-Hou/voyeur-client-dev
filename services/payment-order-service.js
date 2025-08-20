import axios from "axios";
const BASIC_API = process.env.NEXT_PUBLIC_API_BASE_URL + "/PaymentOrder";

class PaymentOrderService {
    create(data) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.post(`${BASIC_API}`, data, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }
}

const NewPaymentOrderService = new PaymentOrderService();
export default NewPaymentOrderService;