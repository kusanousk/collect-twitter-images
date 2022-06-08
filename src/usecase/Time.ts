export class Time {
  private time: string;

  constructor(time: string) {
    if (time.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/) === null) {
      throw new Error(
        `日時の形式が"YYYY-MM-DD HH:mm:ss"ではありません。 time=${time}`
      );
    }

    const date = new Date(time);

    if (isNaN(date.getTime())) {
      throw new Error(`不正な日時です。 time=${time}`);
    }

    this.time = time;
  }

  static fromDate(date: Date): Time {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    const second = String(date.getSeconds()).padStart(2, "0");

    return new Time(`${year}-${month}-${day} ${hour}:${minute}:${second}`);
  }

  private toDate(): Date {
    return new Date(this.time);
  }

  isGreaterThan(other: Time): boolean {
    return this.toDate() > other.toDate();
  }

  isLessThan(other: Time): boolean {
    return this.toDate() < other.toDate();
  }

  isWithinPast7Days(now: Date): boolean {
    const sevenDaysAgo = (() => {
      const dt = new Date(now);
      dt.setDate(dt.getDate() - 7);
      return dt;
    })();

    return sevenDaysAgo < this.toDate();
  }

  toString(): string {
    return this.time;
  }

  toISO(): string {
    return this.toDate().toISOString();
  }
}
