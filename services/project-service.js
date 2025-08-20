import axios from "axios";
const BASIC_API = process.env.NEXT_PUBLIC_API_BASE_URL + "/Project";

class ProjectService {
    search(targetPage = 1, showCount = 10, search = "", sortOrder = "id", sortDirection = "Descending", isReturnAllDataAndNoPage = false) {
        return axios.post(`${BASIC_API}/Search`, {
            search,
            sortOrder,
            sortDirection,
            "pageRequestParameter": {
                isReturnAllDataAndNoPage,
                "targetPage": targetPage,
                "showCount": showCount
            }
        });
    }

    getDetails(projectId) {
        return axios.get(`${BASIC_API}/${projectId}`);
    }

    getDetailsWithAuth(projectId) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.get(`${BASIC_API}/Auth/${projectId}`, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }

    getPaymentSummary(projectSlug) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.get(`${BASIC_API}/PaymentSummary/${projectSlug}`, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }

    getTopDonors(projectSlug, pageNumber = 1, pageSize = 10) {
        const params = new URLSearchParams({
            pageNumber: pageNumber.toString(),
            pageSize: pageSize.toString()
        });
        
        return axios.get(`${BASIC_API}/TopDonors/${projectSlug}?${params.toString()}`);
    }
    
    toggleProjectPaymentVisibility(projectSlug, checked) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.post(`${BASIC_API}/ToggleProjectPaymentVisibility/${projectSlug}`, {
            isPublic: !checked
        }, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }
}

const NewProjectService = new ProjectService();
export default NewProjectService;