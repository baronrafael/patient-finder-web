import { normalizeDocument } from '../../../core/utils/normalize-document';
import { normalizeSearchText } from '../../../core/utils/normalize-search-text';
import { MIN_DOCUMENT_QUERY_LENGTH } from './patient-search.constants';

export interface TextSegment {
  readonly text: string;
  readonly highlight: boolean;
}

export function getHighlightTokens(query: string): readonly string[] {
  const tokens = normalizeSearchText(query).split(' ').filter(Boolean);
  const documentToken = normalizeDocument(query);

  if (documentToken.length >= MIN_DOCUMENT_QUERY_LENGTH && !tokens.includes(documentToken)) {
    return [...tokens, documentToken];
  }

  return tokens;
}

export function highlightSearchText(text: string, query: string): readonly TextSegment[] {
  if (!text) {
    return [{ text: '', highlight: false }];
  }

  const tokens = getHighlightTokens(query);
  if (!tokens.length) {
    return [{ text, highlight: false }];
  }

  const ranges: Array<[number, number]> = [];
  for (const token of tokens) {
    ranges.push(...findTokenRanges(text, token));
  }

  const merged = mergeRanges(ranges);
  if (!merged.length) {
    return [{ text, highlight: false }];
  }

  return rangesToSegments(text, merged);
}

function buildIndexMap(text: string): readonly number[] {
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const length = normalizeSearchText(text.slice(0, i + 1)).length;
    while (map.length < length) {
      map.push(i);
    }
  }

  const normalizedLength = normalizeSearchText(text).length;
  while (map.length < normalizedLength) {
    map.push(text.length > 0 ? text.length - 1 : 0);
  }

  return map;
}

function findTokenRanges(text: string, token: string): Array<[number, number]> {
  const digitToken = token.replace(/\D/g, '');
  if (digitToken.length >= MIN_DOCUMENT_QUERY_LENGTH) {
    const digitRanges = findDigitRanges(text, digitToken);
    if (digitRanges.length > 0) {
      return digitRanges;
    }
  }

  const normalizedText = normalizeSearchText(text);
  const normalizedToken = normalizeSearchText(token);
  if (!normalizedToken) {
    return [];
  }

  const indexMap = buildIndexMap(text);
  const ranges: Array<[number, number]> = [];
  let searchFrom = 0;

  while (searchFrom <= normalizedText.length - normalizedToken.length) {
    const index = normalizedText.indexOf(normalizedToken, searchFrom);
    if (index === -1) {
      break;
    }

    const start = indexMap[index] ?? 0;
    const end = (indexMap[index + normalizedToken.length - 1] ?? start) + 1;
    ranges.push([start, end]);
    searchFrom = index + 1;
  }

  return ranges;
}

function findDigitRanges(text: string, digits: string): Array<[number, number]> {
  const normalizedDigits = normalizeDocument(text);
  const index = normalizedDigits.indexOf(digits);
  if (index === -1) {
    return [];
  }

  let digitCount = 0;
  let rangeStart = -1;

  for (let i = 0; i < text.length; i++) {
    if (!/\d/.test(text[i]!)) {
      continue;
    }

    if (digitCount === index) {
      rangeStart = i;
    }

    if (digitCount === index + digits.length - 1) {
      return [[rangeStart, i + 1]];
    }

    digitCount += 1;
  }

  return [];
}

function mergeRanges(ranges: Array<[number, number]>): Array<[number, number]> {
  if (!ranges.length) {
    return [];
  }

  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [sorted[0]!];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]!;
    const last = merged[merged.length - 1]!;

    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
      continue;
    }

    merged.push(current);
  }

  return merged;
}

function rangesToSegments(text: string, ranges: Array<[number, number]>): TextSegment[] {
  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const [start, end] of ranges) {
    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), highlight: false });
    }

    segments.push({ text: text.slice(start, end), highlight: true });
    cursor = end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlight: false });
  }

  return segments;
}
