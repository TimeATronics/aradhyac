// @ts-ignore
export const FETCH_BLOGS = 'FETCH_BLOGS';
export const FETCH_BLOGS_SUCCESS = 'FETCH_BLOGS_SUCCESS';
export const FETCH_BLOGS_FAILURE = 'FETCH_BLOGS_FAILURE';
export const SEARCH_BLOGS = 'SEARCH_BLOGS';
export const SEARCH_BLOGS_SUCCESS = 'SEARCH_BLOGS_SUCCESS';
export const SEARCH_BLOGS_FAILURE = 'SEARCH_BLOGS_FAILURE';
export const CLEAR_BLOG_SEARCH = 'CLEAR_BLOG_SEARCH';

export const fetchBlogs = (page = 1) => ({ type: FETCH_BLOGS, payload: { page } });
export const fetchBlogsSuccess = (data: any) => ({ type: FETCH_BLOGS_SUCCESS, payload: data });
export const fetchBlogsFailure = (error: string) => ({ type: FETCH_BLOGS_FAILURE, payload: error });

export const searchBlogs = (query: string, page = 1, tag = '') => ({ type: SEARCH_BLOGS, payload: { query, page, tag } });
export const searchBlogsSuccess = (data: any, query: string, tag: string = '') => ({ type: SEARCH_BLOGS_SUCCESS, payload: { ...data, q: query, tag } });
export const searchBlogsFailure = (error: string) => ({ type: SEARCH_BLOGS_FAILURE, payload: error });

export const clearBlogSearch = () => ({ type: CLEAR_BLOG_SEARCH });
