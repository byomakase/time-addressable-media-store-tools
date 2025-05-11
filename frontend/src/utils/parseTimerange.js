import { DateTime } from "luxon";

export const parseTimerangeStr = (timerange) => {
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
  const start =
    startSeconds && startNanoseconds
      ? DateTime.fromSeconds(
          parseInt(startSeconds, 10) + parseInt(startNanoseconds, 10) / 10 ** 9
        )
      : undefined;
  const end =
    endSeconds && endNanoseconds
      ? DateTime.fromSeconds(
          parseInt(endSeconds, 10) + parseInt(endNanoseconds, 10) / 10 ** 9
        )
      : undefined;
  return {
    start,
    end,
    includesStart,
    includesEnd,
  };
};
