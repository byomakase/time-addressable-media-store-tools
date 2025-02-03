import { DATE_FORMAT } from "@/constants";
import { DateTime } from "luxon";

const parseTimerange = (timerange) => {
    const [start, end] = timerange
        .substring(1)
        .split("_")
        .map((value) => DateTime.fromSeconds(parseInt(value.split(":")[0], 10)));
    return {
        start: start.toLocaleString(DATE_FORMAT),
        end: end.toLocaleString(DATE_FORMAT),
    };
};

export default parseTimerange;
