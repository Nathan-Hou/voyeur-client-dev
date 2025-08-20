import axios from "axios";
const BASIC_API = process.env.NEXT_PUBLIC_API_BASE_URL;

class NoteService {
    submit(questionId, note) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.post(`${BASIC_API}/SubmitNote.ashx`, 
            {
                questionId,
                note
            }, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }

    editPublicity(questionId, isPublic) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.post(`${BASIC_API}/PublicNote.ashx`,
            {
                questionId,
                isPublic
            }, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }

    uploadImages(formData) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.post(`${BASIC_API}/UploadHandler.ashx`,
            formData, {
                headers: {Authorization: `Bearer ${token}`}
            }
        );
    }

    submitAnswer(testQuestionId, answer, isConfident) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.post(`${BASIC_API}/SubmitAnswer.ashx`, 
            {
                testQuestionId,
                answer,
                isConfident
            }, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }

    submitTest(testId) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.post(`${BASIC_API}/SubmitTestPaper.ashx`, 
            {
                testId,
            }, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }

    deleteNotes(questionIds) {
        let token;
        JSON.parse(localStorage.getItem("auth_token"))
        ? token = JSON.parse(localStorage.getItem("auth_token")).token
        : token = "";

        return axios.post(`${BASIC_API}/DeleteNote.ashx`, 
            {
                questionIds,
            }, {
            headers: {Authorization: `Bearer ${token}`}
        });
    }
}

const NewNoteService = new NoteService();
export default NewNoteService;