// @ts-ignore
export const FETCH_MESSAGE_REQUEST = 'FETCH_MESSAGE_REQUEST';
export const FETCH_MESSAGE_SUCCESS = 'FETCH_MESSAGE_SUCCESS';
export const FETCH_MESSAGE_FAILURE = 'FETCH_MESSAGE_FAILURE';

export const FETCH_IMAGE_REQUEST = 'FETCH_IMAGE_REQUEST';
export const FETCH_IMAGE_SUCCESS = 'FETCH_IMAGE_SUCCESS';
export const FETCH_IMAGE_FAILURE = 'FETCH_IMAGE_FAILURE';

export const FETCH_ASSETS_REQUEST = 'FETCH_ASSETS_REQUEST';
export const FETCH_ASSETS_SUCCESS = 'FETCH_ASSETS_SUCCESS';
export const FETCH_ASSETS_FAILURE = 'FETCH_ASSETS_FAILURE';

export interface MessageState {
  message: string;
  loading: boolean;
  error: string | null;
}

export interface ImageState {
  url: string;
  loading: boolean;
  error: string | null;
}

export interface Asset {
  id: number;
  file_name: string;
  file_type: string;
}

export interface AssetsState {
  assets: Asset[];
  loading: boolean;
  error: string | null;
}

export interface FetchMessageRequestAction {
  type: typeof FETCH_MESSAGE_REQUEST;
}

export interface FetchMessageSuccessAction {
  type: typeof FETCH_MESSAGE_SUCCESS;
  payload: string;
}

export interface FetchMessageFailureAction {
  type: typeof FETCH_MESSAGE_FAILURE;
  payload: string;
}

export interface FetchImageRequestAction {
  type: typeof FETCH_IMAGE_REQUEST;
  payload: string;
}

export interface FetchImageSuccessAction {
  type: typeof FETCH_IMAGE_SUCCESS;
  payload: string;
}

export interface FetchImageFailureAction {
  type: typeof FETCH_IMAGE_FAILURE;
  payload: string;
}

export interface FetchAssetsRequestAction {
  type: typeof FETCH_ASSETS_REQUEST;
}

export interface FetchAssetsSuccessAction {
  type: typeof FETCH_ASSETS_SUCCESS;
  payload: Asset[];
}

export interface FetchAssetsFailureAction {
  type: typeof FETCH_ASSETS_FAILURE;
  payload: string;
}

export type MessageActionTypes =
  | FetchMessageRequestAction
  | FetchMessageSuccessAction
  | FetchMessageFailureAction;

export type ImageActionTypes =
  | FetchImageRequestAction
  | FetchImageSuccessAction
  | FetchImageFailureAction;

export type AssetsActionTypes =
  | FetchAssetsRequestAction
  | FetchAssetsSuccessAction
  | FetchAssetsFailureAction;
