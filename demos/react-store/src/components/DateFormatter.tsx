import { type Reactive, Cell, Resource } from "@starbeam/core";
import { useProp, useStarbeam } from "@starbeam/react";

import {
  formatLocale,
  SYSTEM_LOCALE,
  SYSTEM_TZ,
  TIME_ZONES,
  timeZoneName,
} from "./intl.js";

export default function (props: { locale: string }) {
  const locale = useProp(props.locale);

  return useStarbeam((component) => {
    const timeZone = Cell(SYSTEM_TZ, "system time zone");
    const date = component.use(Clock(timeZone, locale));

    return () => {
      const localeInfo = formatLocale(locale.current);

      return (
        <>
          <h2>A Date Formatter</h2>
          <h3>
            for {localeInfo.region} ({localeInfo.language})
          </h3>

          <form>
            <label>
              <span>Time Zone</span>
              <select
                size={5}
                value={timeZone.current}
                onInput={(e) => (timeZone.current = e.currentTarget.value)}
              >
                {TIME_ZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {timeZoneName(locale.current, tz)}
                  </option>
                ))}
              </select>
            </label>
          </form>

          <p className="output">{date.current.formatted}</p>
        </>
      );
    };
  });
}

function Clock(timeZone: Reactive<string>, locale: Reactive<string>) {
  const date = Cell(new Date(), "current time");

  function refresh() {
    date.current = new Date();
  }

  return Resource((resource) => {
    const interval = setInterval(() => refresh(), 1000);

    resource.on.cleanup(() => clearInterval(interval));

    return () => ({
      formatted: formatDate(date.current, locale.current, timeZone.current),
      refresh,
    });
  });
}

function formatDate(date: Date, locale = SYSTEM_LOCALE, timeZone = SYSTEM_TZ) {
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    timeZoneName: "long",
    timeZone,
  }).format(date);
}
