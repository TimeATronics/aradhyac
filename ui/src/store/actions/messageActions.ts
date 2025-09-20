// @ts-ignore
import type { FetchMessageRequestAction } from '../types';
import { FETCH_MESSAGE_REQUEST } from '../types';

export const fetchMessageRequest = (): FetchMessageRequestAction => ({
  type: FETCH_MESSAGE_REQUEST,
});
