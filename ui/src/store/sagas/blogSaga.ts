// @ts-ignore
import { call, put, takeEvery } from 'redux-saga/effects';
import { FETCH_BLOGS, SEARCH_BLOGS, fetchBlogsSuccess, fetchBlogsFailure, searchBlogsSuccess, searchBlogsFailure } from '../actions/blogActions';

function* fetchBlogsSaga(action: any): Generator<any, void, any> {
  try {
    const page = action.payload?.page || 1;
    const response: Response = yield call(fetch, `/api/blogs?page=${page}&per_page=4`);
    const data: any = yield response.json();
    yield put(fetchBlogsSuccess(data));
  } catch (error) {
    yield put(fetchBlogsFailure((error as Error).message));
  }
}

function* searchBlogsSaga(action: any): Generator<any, void, any> {
  try {
    const query = action.payload?.query || '';
    const page = action.payload?.page || 1;
    const tag = action.payload?.tag || '';
    const params = `page=${page}&per_page=4&q=${encodeURIComponent(query)}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`;
    const response: Response = yield call(fetch, `/api/blogs/search?${params}`);
    let data: any = yield response.json();
    // Normalize array responses from /search into the paginated shape used elsewhere
    if (Array.isArray(data)) {
      data = { items: data, total: data.length, page, per_page: 4 };
    }
    yield put(searchBlogsSuccess(data, query, tag));
  } catch (error) {
    yield put(searchBlogsFailure((error as Error).message));
  }
}

export function* watchFetchBlogs() {
  yield takeEvery(FETCH_BLOGS, fetchBlogsSaga);
}

export function* watchSearchBlogs() {
  yield takeEvery(SEARCH_BLOGS, searchBlogsSaga);
}
