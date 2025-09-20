// @ts-ignore
import type { ImageState, ImageActionTypes } from '../types';
import {
  FETCH_IMAGE_REQUEST,
  FETCH_IMAGE_SUCCESS,
  FETCH_IMAGE_FAILURE,
} from '../types';

const initialState: ImageState = {
  url: '',
  loading: false,
  error: null,
};

const imageReducer = (
  state: ImageState = initialState,
  action: ImageActionTypes
): ImageState => {
  switch (action.type) {
    case FETCH_IMAGE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_IMAGE_SUCCESS:
      return {
        ...state,
        loading: false,
        url: action.payload,
      };
    case FETCH_IMAGE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

export default imageReducer;