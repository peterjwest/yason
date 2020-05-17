import tokenize from './tokenize';
import parse from './parse';

export const decode = (data: string) => parse(tokenize(data)).getData();
export default { decode };
