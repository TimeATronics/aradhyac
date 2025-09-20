// @ts-ignore
import type { FetchImageRequestAction } from '../types';
import { FETCH_IMAGE_REQUEST } from '../types';

export const fetchImageRequest = (fileName: string): FetchImageRequestAction => ({
  type: FETCH_IMAGE_REQUEST,
  payload: fileName,
});