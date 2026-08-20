/* global SunCalc, moment */

/**
 * MMM-ClockPro — drop-in replacement for the built-in clock module.
 *
 * Improvements over the default clock:
 *  - Self-correcting timer: each tick re-aligns to the actual next
 *    second/minute boundary, eliminating accumulated drift.
 *  - stop() clears the pending timer when the module is hidden/disabled.
 *  - Own bundled suncalc (bypasses the broken suncalc-global.mjs shim).
 *  - Own _fmtTime (no dependency on the global formatTime from utils.js).
 */
Module.register("MMM-ClockPro", {
	defaults: {
		displayType: "digital", // "digital" | "analog" | "both"

		timeFormat: config.timeFormat,
		timezone: null,

		displaySeconds: true,
		showPeriod: true,
		showPeriodUpper: false,
		clockBold: false,
		showDate: true,
		showTime: true,
		showWeek: false, // true | false | "short"
		dateFormat: "dddd, LL",
		sendNotifications: false,

		analogSize: "200px",
		analogFace: "simple",
		analogPlacement: "bottom",
		analogShowDate: "top",

		showDayAbbr: true,   // show 3-letter abbreviated day name (e.g. "Mon")
		showMonthAbbr: true, // show 3-letter abbreviated month name (e.g. "Aug")

		showSunTimes: false, // true | false | "disableNextEvent"
		showMoonTimes: false, // false | "times" | "percent" | "phase" | "both"
		lat: 47.630539,
		lon: -122.344147,
	},

	getScripts () {
		// Load suncalc via its server-exposed absolute path so the browser gets
		// the real UMD file (which sets window.SunCalc).  The vendor.js entry
		// "suncalc.js" → "js/suncalc-global.mjs" fails because it imports from
		// node_modules/suncalc/index.js which does not exist.
		return ["moment.js", "moment-timezone.js", "/node_modules/suncalc/suncalc.js"];
	},

	getStyles () {
		return ["MMM-ClockPro.css", "font-awesome.css"];
	},

	start () {
		Log.info(`Starting module: ${this.name}`);
		moment.locale(config.language);
		this._timer = null;
		this._tick();
	},

	stop () {
		if (this._timer) {
			clearTimeout(this._timer);
			this._timer = null;
		}
	},

	getDom () {
		return this._buildDom(this._now());
	},

	// ─── Timer ────────────────────────────────────────────────────────────────

	_tick () {
		this.updateDom(0);

		if (this.config.sendNotifications) {
			const now = this._now();
			const sec = now.seconds();
			if (this.config.displaySeconds && sec !== 0) {
				this.sendNotification("CLOCK_SECOND", sec);
			} else if (sec === 0) {
				this.sendNotification("CLOCK_MINUTE", now.minutes());
			}
		}

		const now = this._now();
		const ms = now.milliseconds();
		const delay = this.config.displaySeconds
			? 1050 - ms
			: (60 - now.seconds()) * 1000 - ms + 50;
		this._timer = setTimeout(() => this._tick(), Math.max(delay, 100));
	},

	// ─── DOM builder ──────────────────────────────────────────────────────────

	_buildDom (now) {
		const cfg = this.config;
		const wrapper = document.createElement("div");
		wrapper.classList.add("clockpro-grid");

		// ── Analog clock ──────────────────────────────────────────────────────
		const analogWrapper = document.createElement("div");
		analogWrapper.className = "clockpro-circle";

		if (cfg.displayType !== "digital") {
			analogWrapper.style.width = cfg.analogSize;
			analogWrapper.style.height = cfg.analogSize;

			if (cfg.analogFace && cfg.analogFace !== "simple" && cfg.analogFace !== "none") {
				analogWrapper.style.background = `url(${this.data.path}faces/${cfg.analogFace}.svg)`;
				analogWrapper.style.backgroundSize = "100%";
				analogWrapper.style.border = "rgba(0,0,0,0.1)";
			} else if (cfg.analogFace !== "none") {
				analogWrapper.style.border = "2px solid white";
			}

			const sec = now.seconds() * 6;
			const min = now.minute() * 6 + sec / 60;
			const hr = ((now.hours() % 12) / 12) * 360 + 90 + min / 12;

			const face = document.createElement("div");
			face.className = "clockpro-face";

			const hourHand = document.createElement("div");
			hourHand.className = "clockpro-hour-hand";
			hourHand.style.transform = `rotate(${hr}deg)`;
			face.appendChild(hourHand);

			const minHand = document.createElement("div");
			minHand.className = "clockpro-minute-hand";
			minHand.style.transform = `rotate(${min}deg)`;
			face.appendChild(minHand);

			if (cfg.displaySeconds) {
				const secHand = document.createElement("div");
				secHand.className = "clockpro-second-hand";
				secHand.style.transform = `rotate(${sec}deg)`;
				face.appendChild(secHand);
			}

			analogWrapper.appendChild(face);
		}

		// ── Digital clock ─────────────────────────────────────────────────────
		const digitalWrapper = document.createElement("div");
		digitalWrapper.className = "digital";

		if (cfg.showDate && cfg.displayType !== "analog") {
			const dateEl = document.createElement("div");
			dateEl.className = "date normal medium";
			dateEl.innerHTML = now.format(cfg.dateFormat);
			digitalWrapper.appendChild(dateEl);
		}

		if (cfg.showDayAbbr && cfg.displayType !== "analog") {
			const dayEl = document.createElement("div");
			dayEl.className = "date normal medium";
			dayEl.innerHTML = now.format("ddd");
			digitalWrapper.appendChild(dayEl);
		}

		if (cfg.showMonthAbbr && cfg.displayType !== "analog") {
			const monthEl = document.createElement("div");
			monthEl.className = "date normal medium";
			monthEl.innerHTML = now.format("MMM");
			digitalWrapper.appendChild(monthEl);
		}

		if (cfg.displayType !== "analog" && cfg.showTime) {
			const timeWrapper = document.createElement("div");
			timeWrapper.className = "time bright large light";

			const hourFmt = cfg.timeFormat !== 24 ? "h" : "HH";
			const hoursEl = document.createElement("span");
			hoursEl.className = "clockpro-hour-digital";
			hoursEl.innerHTML = now.format(hourFmt);
			timeWrapper.appendChild(hoursEl);

			if (!cfg.clockBold) {
				timeWrapper.appendChild(document.createTextNode(":"));
			}

			const minutesEl = document.createElement("span");
			minutesEl.className = "clockpro-minute-digital";
			if (cfg.clockBold) minutesEl.classList.add("bold");
			minutesEl.innerHTML = now.format("mm");
			timeWrapper.appendChild(minutesEl);

			if (cfg.displaySeconds) {
				const secondsEl = document.createElement("sup");
				secondsEl.className = "clockpro-second-digital dimmed";
				secondsEl.innerHTML = now.format("ss");
				timeWrapper.appendChild(secondsEl);
			}

			if (cfg.showPeriod && cfg.timeFormat !== 24) {
				const periodEl = document.createElement("span");
				periodEl.className = "clockpro-period";
				periodEl.innerHTML = now.format(cfg.showPeriodUpper ? "A" : "a");
				timeWrapper.appendChild(periodEl);
			}

			digitalWrapper.appendChild(timeWrapper);
		}

		if (cfg.showSunTimes) {
			const sunEl = document.createElement("div");
			sunEl.className = "sun dimmed small";
			sunEl.innerHTML = this._sunHtml(now);
			digitalWrapper.appendChild(sunEl);
		}

		if (cfg.showMoonTimes) {
			const moonEl = document.createElement("div");
			moonEl.className = "moon dimmed small";
			moonEl.innerHTML = this._moonHtml(now);
			digitalWrapper.appendChild(moonEl);
		}

		if (cfg.showWeek) {
			const weekEl = document.createElement("div");
			weekEl.className = "week dimmed medium";
			const key = cfg.showWeek === "short" ? "WEEK_SHORT" : "WEEK";
			weekEl.innerHTML = this.translate(key, { weekNumber: now.week() });
			digitalWrapper.appendChild(weekEl);
		}

		// ── Layout ────────────────────────────────────────────────────────────
		if (cfg.displayType === "analog") {
			if (cfg.analogShowDate === "bottom") wrapper.classList.add("clockpro-grid-bottom");
			else wrapper.classList.add("clockpro-grid-top");
			if (cfg.showDate) {
				const dateEl = document.createElement("div");
				dateEl.className = "date normal medium";
				dateEl.innerHTML = now.format(cfg.dateFormat);
				wrapper.appendChild(dateEl);
			}
			wrapper.appendChild(analogWrapper);
		} else if (cfg.displayType === "digital") {
			wrapper.appendChild(digitalWrapper);
		} else {
			wrapper.classList.add(`clockpro-grid-${cfg.analogPlacement}`);
			wrapper.appendChild(analogWrapper);
			wrapper.appendChild(digitalWrapper);
		}

		return wrapper;
	},

	// ─── Sun/moon HTML builders ───────────────────────────────────────────────

	_sunHtml (now) {
		if (typeof SunCalc === "undefined") {
			return "<span>SunCalc unavailable</span>";
		}
		try {
			const times = SunCalc.getTimes(now.toDate(), this.config.lat, this.config.lon);
			const isVisible = now.isBetween(moment(times.sunrise), moment(times.sunset));
			let html = "";

			if (this.config.showSunTimes !== "disableNextEvent") {
				let next;
				if (now.isBefore(times.sunrise)) {
					next = times.sunrise;
				} else if (now.isBefore(times.sunset)) {
					next = times.sunset;
				} else {
					next = SunCalc.getTimes(now.clone().add(1, "day").toDate(), this.config.lat, this.config.lon).sunrise;
				}
				const diff = moment.duration(moment(next).diff(now));
				const icon = isVisible ? "fa-moon" : "fa-sun";
				html += `<span class="${isVisible ? "bright" : ""}"><i class="fas ${icon}" aria-hidden="true"></i> ${diff.hours()}h ${diff.minutes()}m</span>`;
			}

			html += `<span><i class="fas fa-arrow-up" aria-hidden="true"></i> ${this._fmtTime(times.sunrise)}</span>`
				  + `<span><i class="fas fa-arrow-down" aria-hidden="true"></i> ${this._fmtTime(times.sunset)}</span>`;
			return html;
		} catch (err) {
			Log.error(`${this.name}: SunCalc error:`, err);
			return `<span>${err}</span>`;
		}
	},

	_moonHtml (now) {
		if (typeof SunCalc === "undefined") return "";
		try {
			const illum = SunCalc.getMoonIllumination(now.toDate());
			const times = SunCalc.getMoonTimes(now.toDate(), this.config.lat, this.config.lon);
			const rise = times.rise;
			let set = times.set;
			if (!moment(set).isAfter(rise)) {
				set = SunCalc.getMoonTimes(now.clone().add(1, "day").toDate(), this.config.lat, this.config.lon).set;
			}
			const isVisible = now.isBetween(moment(rise), moment(set)) || times.alwaysUp === true;
			const showPct = ["both", "percent"].includes(this.config.showMoonTimes);
			const showPhase = ["both", "phase"].includes(this.config.showMoonTimes);
			const pct = `${Math.round(illum.fraction * 100)}%`;
			const icon = showPhase
				? [..."🌑🌒🌓🌔🌕🌖🌗🌘"][Math.floor(illum.phase * 8)]
				: `<i class="fas fa-moon" aria-hidden="true"></i>`;
			return `<span class="${isVisible ? "bright" : ""}">${icon}${showPct ? " " + pct : ""}</span>`
				+ `<span><i class="fas fa-arrow-up" aria-hidden="true"></i> ${rise ? this._fmtTime(rise) : "..."}</span>`
				+ `<span><i class="fas fa-arrow-down" aria-hidden="true"></i> ${set ? this._fmtTime(set) : "..."}</span>`;
		} catch (err) {
			Log.error(`${this.name}: MoonCalc error:`, err);
			return "";
		}
	},

	// ─── Helpers ──────────────────────────────────────────────────────────────

	_fmtTime (date) {
		const m = moment(date);
		if (this.config.timezone) m.tz(this.config.timezone);
		if (this.config.timeFormat !== 24) {
			if (this.config.showPeriod) {
				return m.format(this.config.showPeriodUpper ? "h:mm A" : "h:mm a");
			}
			return m.format("h:mm");
		}
		return m.format("HH:mm");
	},

	_now () {
		const m = moment();
		if (this.config.timezone) m.tz(this.config.timezone);
		return m;
	},
});
