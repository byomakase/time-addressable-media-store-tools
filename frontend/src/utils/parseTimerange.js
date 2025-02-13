import { DATE_FORMAT } from "@/constants";
import { DateTime } from "luxon";

const parseTimerange = (timerange) => {
    const secondsValues = timerange
        .substring(1)
        .split("_")
        .map((value) => parseInt(value.split(":")[0], 10));
    if (secondsValues.length === 1) {
        return {
            start: DateTime.fromSeconds(secondsValues[0]).toLocaleString(DATE_FORMAT),
            end: null,
        };
    } else if (secondsValues.length === 2) {
        return {
            start: DateTime.fromSeconds(secondsValues[0]).toLocaleString(DATE_FORMAT),
            end: DateTime.fromSeconds(secondsValues[1]).toLocaleString(DATE_FORMAT),
        };
    };
};

export default parseTimerange;
