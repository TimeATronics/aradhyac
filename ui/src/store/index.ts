// @ts-ignore
import { createStore, applyMiddleware, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';
import messageReducer from './reducers/messageReducer';
import imageReducer from './reducers/imageReducer';
import assetsReducer from './reducers/assetsReducer';
import { watchFetchMessage } from './sagas/messageSaga';
import { watchFetchImage } from './sagas/imageSaga';
import { watchFetchAssets } from './sagas/assetsSaga';
import type { MessageState } from './types';

export type RootState = {
  message: MessageState;
  image: import('./types').ImageState;
  assets: import('./types').AssetsState;
};

const rootReducer = combineReducers<RootState>({
  message: messageReducer as any,
  image: imageReducer as any,
  assets: assetsReducer as any,
});

function* rootSaga() {
  yield all([watchFetchMessage(), watchFetchImage(), watchFetchAssets()]);
}

const sagaMiddleware = createSagaMiddleware();

const store = createStore(rootReducer, applyMiddleware(sagaMiddleware));

sagaMiddleware.run(rootSaga);

export type AppDispatch = typeof store.dispatch;

export default store;
