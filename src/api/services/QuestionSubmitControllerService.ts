/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseResponse_long_ } from '../models/BaseResponse_long_';
import type { BaseResponse_Page_QuestionSubmit_ } from '../models/BaseResponse_Page_QuestionSubmit_';
import type { BaseResponse_Page_QuestionSubmitVO_ } from '../models/BaseResponse_Page_QuestionSubmitVO_';
import type { QuestionSubmitAddRequest } from '../models/QuestionSubmitAddRequest';
import type { QuestionSubmitQueryRequest } from '../models/QuestionSubmitQueryRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class QuestionSubmitControllerService {
    /**
     * doQuestionSubmit
     * @returns BaseResponse_long_ OK
     * @returns any Created
     * @throws ApiError
     */
    public static doQuestionSubmitUsingPost({
        questionSubmitAddRequest,
    }: {
        /**
         * questionSubmitAddRequest
         */
        questionSubmitAddRequest: QuestionSubmitAddRequest,
    }): CancelablePromise<BaseResponse_long_ | any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/question_submit/',
            body: questionSubmitAddRequest,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * listQuestionSubmitByPage
     * @returns BaseResponse_Page_QuestionSubmit_ OK
     * @returns any Created
     * @throws ApiError
     */
    public static listQuestionSubmitByPageUsingPost({
        questionSubmitQueryRequest,
    }: {
        /**
         * questionSubmitQueryRequest
         */
        questionSubmitQueryRequest: QuestionSubmitQueryRequest,
    }): CancelablePromise<BaseResponse_Page_QuestionSubmit_ | any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/question_submit/list/page',
            body: questionSubmitQueryRequest,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * listQuestionSubmitVOByPage
     * @returns BaseResponse_Page_QuestionSubmitVO_ OK
     * @returns any Created
     * @throws ApiError
     */
    public static listQuestionSubmitVoByPageUsingPost({
        questionSubmitQueryRequest,
    }: {
        /**
         * questionSubmitQueryRequest
         */
        questionSubmitQueryRequest: QuestionSubmitQueryRequest,
    }): CancelablePromise<BaseResponse_Page_QuestionSubmitVO_ | any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/question_submit/list/page/vo',
            body: questionSubmitQueryRequest,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * listMyQuestionSubmitVOByPage
     * @returns BaseResponse_Page_QuestionSubmitVO_ OK
     * @returns any Created
     * @throws ApiError
     */
    public static listMyQuestionSubmitVoByPageUsingPost({
        questionSubmitQueryRequest,
    }: {
        /**
         * questionSubmitQueryRequest
         */
        questionSubmitQueryRequest: QuestionSubmitQueryRequest,
    }): CancelablePromise<BaseResponse_Page_QuestionSubmitVO_ | any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/question_submit/my/list/page',
            body: questionSubmitQueryRequest,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
}
