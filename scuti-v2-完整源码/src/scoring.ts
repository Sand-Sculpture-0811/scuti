import people from './personalities.json';
import questions from './questions.json';
export { people, questions };
export const VERSION = '48-v2-paperfigures';
export const COUNT = questions.length;
export const weights = questions.map(q => people.map(p => (q.weights as Record<string, number | undefined>)[p.id] ?? 0));
export function score(answers: number[], temperature = .25) {
  if (answers.length !== COUNT || answers.some(x => !Number.isInteger(x) || x < 1 || x > 5)) throw Error(`请完成全部${COUNT}题，答案须为1至5`);
  if (!Number.isFinite(temperature) || temperature <= 0) throw Error('温度必须是有限正数');
  const z = answers.map(x => (x - 3) / 2);
  // Reverse evidence is already signed in the matrix. Never reverse the answer twice.
  const raw = people.map((_, j) => weights.reduce((sum, row, i) => sum + row[j] * z[i], 0) / weights.reduce((sum, row) => sum + Math.abs(row[j]), 0));
  const max = Math.max(...raw);
  const exp = raw.map(x => Math.exp((x - max) / temperature));
  const total = exp.reduce((a, b) => a + b, 0);
  const shares = exp.map(x => 100 * x / total);
  const percent = shares.map(Math.floor);
  const remainderOrder = shares.map((v, i) => ({ i, r: v - percent[i] })).sort((a, b) => b.r - a.r || a.i - b.i);
  const missing = 100 - percent.reduce((a, b) => a + b, 0);
  for (let i = 0; i < missing; i++) percent[remainderOrder[i].i]++;
  const distinct = people.map((p, j) => questions.reduce((sum, q, i) => sum + (q.primary === p.id ? weights[i][j] * z[i] : 0), 0));
  // Strict raw rank first. Exact ties: direct evidence then stable ID order.
  const order = people.map((_, i) => i).sort((a, b) => raw[b] - raw[a] || distinct[b] - distinct[a] || a - b);
  const tied = order.filter(i => raw[i] === max);
  const consistentPairs = people.map(p => {
    const indices = questions.flatMap((q, i) => q.primary === p.id ? [i] : []);
    const forward = indices.filter(i => !questions[i].reverse).map(i => z[i]);
    const reverse = indices.find(i => questions[i].reverse)!;
    return { id: p.id, tension: forward.every(x => x >= .5) && z[reverse] >= .5 };
  });
  return { raw, shares, percent, distinct, order, tied, neutral: answers.every(x => x === 3), flat: answers.every(x => x === answers[0]), mixed: raw[order[0]] - raw[order[1]] < .08, tensionCount: consistentPairs.filter(x => x.tension).length };
}
