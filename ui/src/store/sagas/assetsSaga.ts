// @ts-ignore
import { call, put, takeEvery } from 'redux-saga/effects';
import type {
  FetchAssetsSuccessAction,
  FetchAssetsFailureAction,
} from '../types';
import { FETCH_ASSETS_REQUEST } from '../types';

function* fetchAssetsSaga() {
  try {
    const response: Response = yield call(fetch, '/api/s3-assets');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data: import('../types').Asset[] = yield call([response, response.json]);
    yield put<FetchAssetsSuccessAction>({
      type: 'FETCH_ASSETS_SUCCESS',
      payload: data,
    });
  } catch (error) {
    yield put<FetchAssetsFailureAction>({
      type: 'FETCH_ASSETS_FAILURE',
      payload: (error as Error).message,
    });
  }
}

export function* watchFetchAssets() {
  yield takeEvery(FETCH_ASSETS_REQUEST, fetchAssetsSaga);
}
