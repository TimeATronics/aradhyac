// @ts-ignore
import type { AssetsState, AssetsActionTypes } from '../types';
import {
  FETCH_ASSETS_REQUEST,
  FETCH_ASSETS_SUCCESS,
  FETCH_ASSETS_FAILURE,
} from '../types';

const initialState: AssetsState = {
  assets: [],
  loading: false,
  error: null,
};

const assetsReducer = (
  state: AssetsState = initialState,
  action: AssetsActionTypes
): AssetsState => {
  switch (action.type) {
    case FETCH_ASSETS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_ASSETS_SUCCESS:
      return {
        ...state,
        loading: false,
        assets: action.payload,
      };
    case FETCH_ASSETS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

export default assetsReducer;
