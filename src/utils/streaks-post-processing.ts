import { MyCasts } from "@/types";

export interface PreviousConsecutiveCastsProps {
  consecutiveWeeks: number;
  consideredCasts: MyCasts[];
}

export const getMaxPreviousConsecutiveWeeksForFid = (
  casts: MyCasts[]
): PreviousConsecutiveCastsProps => {
  console.log("Length: ", casts.length);
  if (casts.length === 0) return { consecutiveWeeks: 0, consideredCasts: [] };

  // Сортируем посты по убыванию даты
  casts.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const currentDate = new Date();
  currentDate.setUTCHours(0, 0, 0, 0);
  // Устанавливаем дату на начало текущей недели (понедельник)
  currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1);

  console.log("Current date:", currentDate);

  const oneWeek = 7 * 24 * 60 * 60 * 1000; // Миллисекунды в неделе
  let weekEnd = new Date(currentDate.getTime());
  console.log("Week start: ", weekEnd);
  let consecutiveWeeks = 0;
  let maxConsecutiveWeeks = 0;
  let postIndex = 0;
  let castsStreaks = Array<MyCasts>();

  while (postIndex < casts.length) {
    const weekStart = new Date(weekEnd.getTime() - oneWeek);
    let hadPostThisWeek = false;
    let isAddedCastForThisWeek = false;

    while (postIndex < casts.length) {
      const postDate = new Date(casts[postIndex].timestamp);
      if (postDate >= weekStart && postDate < weekEnd) {
        hadPostThisWeek = true;

        !isAddedCastForThisWeek ? castsStreaks.push(casts[postIndex]) : null;
        isAddedCastForThisWeek = true;

        postIndex++;
      } else if (postDate < weekStart) {
        break;
      } else {
        postIndex++;
      }
    }

    if (hadPostThisWeek) {
      consecutiveWeeks++;
      maxConsecutiveWeeks = Math.max(maxConsecutiveWeeks, consecutiveWeeks);
    } else {
      break; // Прерываем цикл при первой неделе без постов
    }

    weekEnd = weekStart;
  }

  console.log("Res: ", maxConsecutiveWeeks);
  console.log("Included casts: ", castsStreaks);

  return {
    consecutiveWeeks: maxConsecutiveWeeks,
    consideredCasts: castsStreaks,
  };
};
