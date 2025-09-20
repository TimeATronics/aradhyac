// @ts-ignore
import type { MessageState, MessageActionTypes } from '../types';
import {
  FETCH_MESSAGE_REQUEST,
  FETCH_MESSAGE_SUCCESS,
  FETCH_MESSAGE_FAILURE,
} from '../types';

const initialState: MessageState = {
  message: '',
  loading: false,
  error: null,
};

const messageReducer = (
  state: MessageState = initialState,
  action: MessageActionTypes
): MessageState => {
  switch (action.type) {
    case FETCH_MESSAGE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_MESSAGE_SUCCESS:
      return {
        ...state,
        loading: false,
        message: action.payload,
      };
    case FETCH_MESSAGE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

export default messageReducer;
