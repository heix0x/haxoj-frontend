/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseResponse_boolean_ } from '../models/BaseResponse_boolean_';
import type { BaseResponse_long_ } from '../models/BaseResponse_long_';
import type { BaseResponse_Page_Post_ } from '../models/BaseResponse_Page_Post_';
import type { BaseResponse_Page_PostVO_ } from '../models/BaseResponse_Page_PostVO_';
import type { BaseResponse_PostVO_ } from '../models/BaseResponse_PostVO_';
import type { DeleteRequest } from '../models/DeleteRequest';
import type { PostAddRequest } from '../models/PostAddRequest';
import type { PostEditRequest } from '../models/PostEditRequest';
import type { PostQueryRequest } from '../models/PostQueryRequest';
import type { PostUpdateRequest } from '../models/PostUpdateRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PostControllerService {
    /**
     * addPost
     * @returns BaseResponse_long_ OK
     * @returns any Created
     * @throws ApiError
     */
    public static addPostUsingPost({
        postAddRequest,
    }: {
        /**
         * postAddRequest
         */
        postAddRequest: PostAddRequest,
    }): CancelablePromise<BaseResponse_long_ | any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/post/add',
            body: postAddRequest,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * deletePost
     * @returns BaseResponse_boolean_ OK
     * @returns any Created
     * @throws ApiError
     */
    public static deletePostUsingPost({
        deleteRequest,
    }: {
        /**
         * deleteRequest
         */
        deleteRequest: DeleteRequest,
    }): CancelablePromise<BaseResponse_boolean_ | any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/post/delete',
            body: deleteRequest,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * editPost
     * @returns BaseResponse_boolean_ OK
     * @returns any Created
     * @throws ApiError
     */
    public static editPostUsingPost({
        postEditRequest,
    }: {
        /**
         * postEditRequest
         */
        postEditRequest: PostEditRequest,
    }): CancelablePromise<BaseResponse_boolean_ | any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/post/edit',
            body: postEditRequest,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * getPostVOById
     * @returns BaseResponse_PostVO_ OK
     * @throws ApiError
     */
    public static getPostVoByIdUsingGet({
        id,
    }: {
        /**
         * id
         */
        id?: number,
    }): CancelablePromise<BaseResponse_PostVO_> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/post/get/vo',
            query: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * listPostByPage
     * @returns BaseResponse_Page_Post_ OK
     * @returns any Created
     * @throws ApiError
     */
    public static listPostByPageUsingPost({
        postQueryRequest,
    }: {
        /**
         * postQueryRequest
         */
        postQueryRequest: PostQueryRequest,
    }): CancelablePromise<BaseResponse_Page_Post_ | any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/post/list/page',
            body: postQueryRequest,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * listPostVOByPage
     * @returns BaseResponse_Page_PostVO_ OK
     * @returns any Created
     * @throws ApiError
     */
    public static listPostVoByPageUsingPost({
        postQueryRequest,
    }: {
        /**
         * postQueryRequest
         */
        postQueryRequest: PostQueryRequest,
    }): CancelablePromise<BaseResponse_Page_PostVO_ | any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/post/list/page/vo',
            body: postQueryRequest,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * listMyPostVOByPage
     * @returns BaseResponse_Page_PostVO_ OK
     * @returns any Created
     * @throws ApiError
     */
    public static listMyPostVoByPageUsingPost({
        postQueryRequest,
    }: {
        /**
         * postQueryRequest
         */
        postQueryRequest: PostQueryRequest,
    }): CancelablePromise<BaseResponse_Page_PostVO_ | any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/post/my/list/page/vo',
            body: postQueryRequest,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * searchPostVOByPage
     * @returns BaseResponse_Page_PostVO_ OK
     * @returns any Created
     * @throws ApiError
     */
    public static searchPostVoByPageUsingPost({
        postQueryRequest,
    }: {
        /**
         * postQueryRequest
         */
        postQueryRequest: PostQueryRequest,
    }): CancelablePromise<BaseResponse_Page_PostVO_ | any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/post/search/page/vo',
            body: postQueryRequest,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * updatePost
     * @returns BaseResponse_boolean_ OK
     * @returns any Created
     * @throws ApiError
     */
    public static updatePostUsingPost({
        postUpdateRequest,
    }: {
        /**
         * postUpdateRequest
         */
        postUpdateRequest: PostUpdateRequest,
    }): CancelablePromise<BaseResponse_boolean_ | any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/post/update',
            body: postUpdateRequest,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
}
