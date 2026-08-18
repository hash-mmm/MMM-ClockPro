# MMM-ClockPro

A stable drop-in replacement for the built-in `clock` module for [MagicMirror²](https://magicmirror.builders/).

## What's different from the built-in clock

| | Built-in `clock` | MMM-ClockPro |
|---|---|---|
| Timer | Recursive `setTimeout` — drifts over time | Self-correcting: each tick re-aligns to the actual next second/minute boundary |
| Sun/moon icon | Always shows `fa-sun` for countdown | Context-aware: `fa-moon` during the day (counting to sunset), `fa-sun` at night (counting to sunrise) |
| AM/PM display | Same size as the time digits | Small superscript in the upper-right corner |
| SunCalc loading | Via `suncalc-global.mjs` shim (broken on some setups) | Loaded directly from `/node_modules/suncalc/suncalc.js` |
| `stop()` | Not implemented | Cancels the pending timer when the module is hidden or disabled |

Everything else — all config options, the analog clock, sun/moon times, week display — works identically to the built-in clock.

## Installation

```bash
cd ~/MagicMirror/modules
git clone https://github.com/hash-mmm/MMM-ClockPro.git
```

No `npm install` needed — all dependencies are bundled with MagicMirror itself.

## Configuration

Replace `clock` with `MMM-ClockPro` in your `config/config.js`. All options are the same:

```js
{
    module: "MMM-ClockPro",
    position: "top_right",
    config: {
        timeFormat: 12,
        showPeriod: true,
        showSunTimes: true,
        lat: 44.916,
        lon: -93.101,
    }
},
```

## Config options

| Option | Default | Description |
|---|---|---|
| `displayType` | `"digital"` | `"digital"` · `"analog"` · `"both"` |
| `timeFormat` | global `config.timeFormat` | `12` or `24` |
| `timezone` | `null` | IANA timezone string, e.g. `"Asia/Riyadh"`. `null` = local time |
| `displaySeconds` | `true` | Show seconds |
| `showPeriod` | `true` | Show AM/PM (12-hour mode only) |
| `showPeriodUpper` | `false` | Uppercase AM/PM |
| `clockBold` | `false` | Bold minutes |
| `showDate` | `true` | Show date line |
| `showTime` | `true` | Show time |
| `showWeek` | `false` | Show week number. `true` · `false` · `"short"` |
| `dateFormat` | `"dddd, LL"` | [Moment.js format](https://momentjs.com/docs/#/displaying/) for the date |
| `sendNotifications` | `false` | Emit `CLOCK_SECOND` / `CLOCK_MINUTE` notifications |
| `analogSize` | `"200px"` | Size of the analog clock face |
| `analogFace` | `"simple"` | `"none"` · `"simple"` · `"face-001"` … `"face-012"` |
| `analogPlacement` | `"bottom"` | Analog clock position relative to digital: `"top"` · `"bottom"` · `"left"` · `"right"` |
| `showSunTimes` | `false` | Show sunrise, sunset, and time remaining. `true` · `false` · `"disableNextEvent"` |
| `showMoonTimes` | `false` | Show moon rise/set. `false` · `"times"` · `"percent"` · `"phase"` · `"both"` |
| `lat` | `47.63` | Latitude for sun/moon calculations |
| `lon` | `-122.34` | Longitude for sun/moon calculations |

## Sun times display

When `showSunTimes: true`, three items are shown:

- **Countdown** — time remaining until the next solar event, with a context-aware icon:
  - 🌙 `fa-moon` during the day → counting down to **sunset**
  - ☀ `fa-sun` at night → counting down to **sunrise**
- **↑ sunrise time**
- **↓ sunset time**

Set `showSunTimes: "disableNextEvent"` to hide the countdown and show only the rise/set times.
