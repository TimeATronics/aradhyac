// @ts-ignore
import { createStore, applyMiddleware, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';
import messageReducer from './reducers/messageReducer';
import imageReducer from './reducers/imageReducer';
import assetsReducer from './reducers/assetsReducer';
import blogReducer from './reducers/blogReducer';
import { watchFetchMessage } from './sagas/messageSaga';
import { watchFetchImage } from './sagas/imageSaga';
import { watchFetchAssets } from './sagas/assetsSaga';
import { watchFetchBlogs, watchSearchBlogs } from './sagas/blogSaga';
import type { MessageState } from './types';
import type { BlogState } from './reducers/blogReducer';

export type RootState = {
  message: MessageState;
  image: import('./types').ImageState;
  assets: import('./types').AssetsState;
  blog: BlogState;
};

const rootReducer = combineReducers<RootState>({
  message: messageReducer as any,
  image: imageReducer as any,
  assets: assetsReducer as any,
  blog: blogReducer as any,
});

function* rootSaga() {
  yield all([watchFetchMessage(), watchFetchImage(), watchFetchAssets(), watchFetchBlogs(), watchSearchBlogs()]);
}

const sagaMiddleware = createSagaMiddleware();

const store = createStore(rootReducer, applyMiddleware(sagaMiddleware));

sagaMiddleware.run(rootSaga);

export type AppDispatch = typeof store.dispatch;

export default store;
