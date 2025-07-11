import { DateTime } from "luxon";

const NANOS_PER_SECOND = 1_000_000_000n;

/**
 * Parses a timerange string and extracts components using regex
 * @param {string} timerange - String in format "[seconds:nanoseconds_seconds:nanoseconds]"
 * @returns {Object} Parsed components and inclusion flags
 */
const parseTimerangeComponents = (timerange) => {
  const regexMatch = timerange.match(
    /^(?<startInclusive>\[|\()?(?:-?(?<startSeconds>\d+):(?<startNanoseconds>\d+))?(?:_(?:-?(?<endSeconds>\d+):(?<endNanoseconds>\d+))?)?(?<endInclusive>\]|\))?$/
  );
  const {
    startInclusive,
    startSeconds,
    startNanoseconds,
    endSeconds,
    endNanoseconds,
    endInclusive,
  } = regexMatch.groups;

  const includesStart = startInclusive
    ? startInclusive === "["
      ? true
      : startInclusive === "("
      ? false
      : undefined
    : true;
  const includesEnd = endInclusive
    ? endInclusive === "]"
      ? true
      : endInclusive === ")"
      ? false
      : undefined
    : true;

  return {
    startSeconds,
    startNanoseconds,
    endSeconds,
    endNanoseconds,
    includesStart,
    includesEnd,
  };
};

/**
 * Converts a timerange string to an object with start and end timestamps using BigInt for nanosecond precision
 * @param {string} timerange - String in format "[seconds:nanoseconds_seconds:nanoseconds]"
 * @returns {Object} Object with start and end as BigInt nanosecond values and inclusion flags
 */
export const parseTimerangeStrBigInt = (timerange) => {
  const {
    startSeconds,
    startNanoseconds,
    endSeconds,
    endNanoseconds,
    includesStart,
    includesEnd,
  } = parseTimerangeComponents(timerange);

  // Convert to BigInt nanoseconds for full precision
  const start =
    startSeconds && startNanoseconds
      ? BigInt(startSeconds) * NANOS_PER_SECOND + BigInt(startNanoseconds)
      : undefined;
  const end =
    endSeconds && endNanoseconds
      ? BigInt(endSeconds) * NANOS_PER_SECOND + BigInt(endNanoseconds)
      : undefined;

  return {
    start,
    end,
    includesStart,
    includesEnd,
  };
};

/**
 * Converts a timerange string to an object with start and end timestamps using Luxon DateTime
 * @param {string} timerange - String in format "[seconds:nanoseconds_seconds:nanoseconds]"
 * @returns {Object} Object with start and end as DateTime objects and inclusion flags
 */
export const parseTimerangeStr = (timerange) => {
  const {
    startSeconds,
    startNanoseconds,
    endSeconds,
    endNanoseconds,
    includesStart,
    includesEnd,
  } = parseTimerangeComponents(timerange);

  const start =
    startSeconds && startNanoseconds
      ? DateTime.fromSeconds(
          parseInt(startSeconds, 10) + parseInt(startNanoseconds, 10) / NANOS_PER_SECOND
        )
      : undefined;
  const end =
    endSeconds && endNanoseconds
      ? DateTime.fromSeconds(
          parseInt(endSeconds, 10) + parseInt(endNanoseconds, 10) / NANOS_PER_SECOND
        )
      : undefined;

  return {
    start,
    end,
    includesStart,
    includesEnd,
  };
};

/**
 * Converts a DateTime object to a timerange string
 * @param {Object} options - Object containing start and end as DateTime objects
 * @param {DateTime} [options.start] - Start time as DateTime
 * @param {DateTime} [options.end] - End time as DateTime
 * @param {boolean} [options.includesStart=true] - Whether the range includes the start time
 * @param {boolean} [options.includesEnd=false] - Whether the range includes the end time
 * @returns {string} Timerange string in format "[seconds:nanoseconds_seconds:nanoseconds]"
 */
export const parseTimerangeObj = ({
  start,
  end,
  includesStart = true,
  includesEnd = false,
}) => {
  const startInclusive = includesStart ? "[" : "(";
  const endInclusive = includesEnd ? "]" : ")";
  const startSeconds = start === undefined ? "" : Math.floor(start.toSeconds());
  const endSeconds = end === undefined ? "" : Math.floor(end.toSeconds());
  const startNanoseconds =
    start === undefined
      ? ""
      : Math.floor(
          (start.toSeconds() - Math.floor(start.toSeconds())) * NANOS_PER_SECOND
        );
  const endNanoseconds =
    end === undefined
      ? ""
      : Math.floor((end.toSeconds() - Math.floor(end.toSeconds())) * NANOS_PER_SECOND);
  const startTimerange =
    start === undefined ? "" : `${startSeconds}:${startNanoseconds}`;
  const endTimerange =
    end === undefined ? "" : `${endSeconds}:${endNanoseconds}`;
  return `${startInclusive}${startTimerange}_${endTimerange}${endInclusive}`;
};

/**
 * Converts an object with BigInt nanosecond timestamps to a timerange string
 * @param {Object} options - Object containing start and end as BigInt nanosecond values
 * @param {BigInt} [options.start] - Start time in nanoseconds
 * @param {BigInt} [options.end] - End time in nanoseconds
 * @param {boolean} [options.includesStart=true] - Whether the range includes the start time
 * @param {boolean} [options.includesEnd=false] - Whether the range includes the end time
 * @returns {string} Timerange string in format "[seconds:nanoseconds_seconds:nanoseconds]"
 */
export const parseTimerangeObjBigInt = ({
  start,
  end,
  includesStart = true,
  includesEnd = false,
}) => {
  const startInclusive = includesStart ? "[" : "(";
  const endInclusive = includesEnd ? "]" : ")";

  let startSeconds = "";
  let startNanoseconds = "";
  if (start !== undefined) {
    const isNegative = start < 0n;
    const absStart = isNegative ? -start : start;
    startSeconds = (isNegative ? "-" : "") + (absStart / NANOS_PER_SECOND).toString();
    startNanoseconds = (absStart % NANOS_PER_SECOND).toString();
  }

  let endSeconds = "";
  let endNanoseconds = "";
  if (end !== undefined) {
    const isNegative = end < 0n;
    const absEnd = isNegative ? -end : end;
    endSeconds = (isNegative ? "-" : "") + (absEnd / NANOS_PER_SECOND).toString();
    endNanoseconds = (absEnd % NANOS_PER_SECOND).toString();
  }

  const startTimerange =
    start === undefined ? "" : `${startSeconds}:${startNanoseconds}`;
  const endTimerange =
    end === undefined ? "" : `${endSeconds}:${endNanoseconds}`;

  return `${startInclusive}${startTimerange}_${endTimerange}${endInclusive}`;
};
