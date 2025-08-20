import axios from "axios";
const BASIC_API = process.env.NEXT_PUBLIC_API_BASE_URL;

class ProfileService {
    getSchoolList() {
        return axios.post(`${BASIC_API}/SchoolList.ashx`);
    }

    getDepartmentList(schoolId) {
        return axios.post(`${BASIC_API}/DepartMentList.ashx`,
            {
                schoolId,
            }
        );
    }
}

const NewProfileService = new ProfileService();
export default NewProfileService;