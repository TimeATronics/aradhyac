// @ts-ignore
import { FETCH_BLOGS_SUCCESS, FETCH_BLOGS_FAILURE, SEARCH_BLOGS_SUCCESS, SEARCH_BLOGS_FAILURE } from '../actions/blogActions';

export interface BlogState {
  blogs: any[];
  searchQuery: string;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  per_page: number;
}

const initialState: BlogState = {
  blogs: [],
  searchQuery: '',
  loading: false,
  error: null,
  total: 0,
  page: 1,
  per_page: 4,
};

const blogReducer = (state = initialState, action: any): BlogState => {
  switch (action.type) {
    case FETCH_BLOGS_SUCCESS:
      return { ...state, blogs: action.payload.items, total: action.payload.total, page: action.payload.page, per_page: action.payload.per_page, loading: false };
    case FETCH_BLOGS_FAILURE:
      return { ...state, error: action.payload, loading: false };
    case SEARCH_BLOGS_SUCCESS:
      return { ...state, blogs: action.payload.items, total: action.payload.total, page: action.payload.page, per_page: action.payload.per_page, loading: false, searchQuery: action.payload.q || '' };
    case SEARCH_BLOGS_FAILURE:
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_BLOG_SEARCH':
      return { ...state, blogs: [], searchQuery: '', total: 0, page: 1 };
    default:
      return state;
  }
};

export default blogReducer;
