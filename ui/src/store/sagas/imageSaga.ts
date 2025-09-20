// @ts-ignore
import { call, put, takeEvery } from 'redux-saga/effects';
import type {
  FetchImageRequestAction,
  FetchImageSuccessAction,
  FetchImageFailureAction,
} from '../types';
import { FETCH_IMAGE_REQUEST } from '../types';

function* fetchImageSaga(action: FetchImageRequestAction) {
  try {
    const response: Response = yield call(fetch, `/api/media/download-url/${action.payload}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data: { url: string } = yield call([response, response.json]);
    yield put<FetchImageSuccessAction>({
      type: 'FETCH_IMAGE_SUCCESS',
      payload: data.url,
    });
  } catch (error) {
    yield put<FetchImageFailureAction>({
      type: 'FETCH_IMAGE_FAILURE',
      payload: (error as Error).message,
    });
  }
}

export function* watchFetchImage() {
  yield takeEvery(FETCH_IMAGE_REQUEST, fetchImageSaga);
}