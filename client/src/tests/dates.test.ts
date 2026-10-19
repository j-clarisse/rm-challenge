import {describe, expect, it} from 'vitest';
import {formatDate, isWithinDateRange} from '../utils';

// Fixed "today" keeps the tests deterministic: 19 Oct 2026 (local midnight)
const TODAY = new Date(2026, 9, 19);

describe("isWithinDateRange", () => {
    describe("past range (last month)", () => {
        it("includes today and the start of the range", () => {
            expect(isWithinDateRange("2026-10-19", -1, TODAY)).toBe(true);
            expect(isWithinDateRange("2026-09-19", -1, TODAY)).toBe(true);
        });

        it("excludes the day before the start and the day after today", () => {
            expect(isWithinDateRange("2026-09-18", -1, TODAY)).toBe(false);
            expect(isWithinDateRange("2026-10-20", -1, TODAY)).toBe(false);
        });
    });

    describe("future range (next year)", () => {
        it("includes today and the end of the range", () => {
            expect(isWithinDateRange("2026-10-19", 12, TODAY)).toBe(true);
            expect(isWithinDateRange("2027-10-19", 12, TODAY)).toBe(true);
        });

        it("excludes the day after the end and the day before today", () => {
            expect(isWithinDateRange("2027-10-20", 12, TODAY)).toBe(false);
            expect(isWithinDateRange("2026-10-18", 12, TODAY)).toBe(false);
        });
    });

    it("uses the month offset for quarters", () => {
        expect(isWithinDateRange("2026-07-19", -3, TODAY)).toBe(true);
        expect(isWithinDateRange("2026-07-18", -3, TODAY)).toBe(false);
        expect(isWithinDateRange("2027-01-19", 3, TODAY)).toBe(true);
        expect(isWithinDateRange("2027-01-20", 3, TODAY)).toBe(false);
    });

    it("rejects missing dates", () => {
        expect(isWithinDateRange(null, -1, TODAY)).toBe(false);
        expect(isWithinDateRange(undefined, 12, TODAY)).toBe(false);
        expect(isWithinDateRange("", 3, TODAY)).toBe(false);
    });

    describe("month end (addMonths clamps to the last day of the month)", () => {
        it("31 Jan + 1 month ends on 28 Feb", () => {
            const jan31 = new Date(2026, 0, 31);
            expect(isWithinDateRange("2026-02-28", 1, jan31)).toBe(true);
            expect(isWithinDateRange("2026-03-01", 1, jan31)).toBe(false);
        });

        it("31 Mar - 1 month starts on 28 Feb", () => {
            const mar31 = new Date(2026, 2, 31);
            expect(isWithinDateRange("2026-02-28", -1, mar31)).toBe(true);
            expect(isWithinDateRange("2026-02-27", -1, mar31)).toBe(false);
        });
    });

    describe("API dates with timezone offsets", () => {
        it("uses only the calendar-day portion", () => {
            // Both are 19 Oct on the calendar regardless of their offset
            expect(isWithinDateRange("2026-10-19T23:30:00-05:00", -1, TODAY)).toBe(true);
            expect(isWithinDateRange("2026-10-19T00:00:00+14:00", -1, TODAY)).toBe(true);
        });

        it("does not let an offset pull a date into the range", () => {
            // 18 Sep is one day before the last-month range, whatever the offset
            expect(isWithinDateRange("2026-09-18T23:59:59-12:00", -1, TODAY)).toBe(false);
        });
    });
});

describe("formatDate", () => {
    it("formats an API date as day, short month and year", () => {
        expect(formatDate("2005-01-06T00:00:00+10:00")).toBe("6 Jan 2005");
    });

    it("keeps the calendar day regardless of the timezone offset", () => {
        expect(formatDate("2001-10-01T00:00:00+08:00")).toBe("1 Oct 2001");
        expect(formatDate("2026-10-19T23:30:00-05:00")).toBe("19 Oct 2026");
    });

    it("shows a dash for missing dates", () => {
        expect(formatDate(null)).toBe("—");
        expect(formatDate(undefined)).toBe("—");
        expect(formatDate("")).toBe("—");
    });
});
