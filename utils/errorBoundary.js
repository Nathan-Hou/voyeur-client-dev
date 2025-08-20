import { ERROR_REDIRECT_STATUS } from "./api-handlers/tests-previous-years";

export function shouldRedirectError(status) {
    return ERROR_REDIRECT_STATUS.includes(status);
}