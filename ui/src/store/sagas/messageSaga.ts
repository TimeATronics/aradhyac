// @ts-ignore
import { call, put, takeEvery } from 'redux-saga/effects';
import type {
  FetchMessageSuccessAction,
  FetchMessageFailureAction,
} from '../types';
import { FETCH_MESSAGE_REQUEST } from '../types';

function* fetchMessageSaga() {
  try {
    const response: Response = yield call(fetch, '/api/message');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data: { message: string } = yield call([response, response.json]);
    yield put<FetchMessageSuccessAction>({
      type: 'FETCH_MESSAGE_SUCCESS',
      payload: data.message,
    });
  } catch (error) {
    yield put<FetchMessageFailureAction>({
      type: 'FETCH_MESSAGE_FAILURE',
      payload: (error as Error).message,
    });
  }
}

export function* watchFetchMessage() {
  yield takeEvery(FETCH_MESSAGE_REQUEST, fetchMessageSaga);
}
