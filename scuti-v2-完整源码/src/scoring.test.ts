import { describe, it, expect } from 'vitest';
import { score, weights, people, questions, COUNT, VERSION } from './scoring';
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
describe('48题行为评分', () => {
  it('每类至少三条直接证据、含反向题、矩阵完整', () => {
    expect(COUNT).toBe(48);
    questions.forEach(q => expect(q.rationale.length).toBeGreaterThan(10));
    weights.forEach(row => { expect(row).toHaveLength(16); expect(row.every(Number.isFinite)).toBe(true); });
    people.forEach(p => { const direct = questions.filter(q => q.primary === p.id); expect(direct).toHaveLength(3); expect(direct.some(q => q.reverse)).toBe(true); });
  });
  it('16类均严格获胜，保存样本、哈希与10000份随机分布', () => {
    const witnesses = people.map((p, j) => {
      // Plausible witness: endorse the target's own direct behaviors; others neutral.
      const answers = questions.map(q => q.primary === p.id ? (q.reverse ? 1 : 5) : 3);
      const r = score(answers), margin = r.raw[j] - Math.max(...r.raw.filter((_, i) => i !== j));
      expect(r.order[0]).toBe(j); expect(margin).toBeGreaterThanOrEqual(.01);
      return { id: p.id, answers, raw: r.raw, margin };
    });
    let seed = 20261029; const wins = Array(16).fill(0), margins: number[] = []; let ties = 0;
    for (let i = 0; i < 10000; i++) {
      const a = Array.from({ length: COUNT }, () => { seed = (1664525 * seed + 1013904223) >>> 0; return 1 + seed % 5; });
      const r = score(a);
      expect(r.percent.reduce((a,b)=>a+b)).toBe(100); expect(r.raw.every(Number.isFinite)).toBe(true);
      expect(r.shares.reduce((a,b)=>a+b)).toBeCloseTo(100, 10);
      if (r.tied.length > 1) ties++; else wins[r.order[0]]++;
      margins.push(r.raw[r.order[0]] - r.raw[r.order[1]]);
    }
    margins.sort((a,b)=>a-b);
    writeFileSync('validation.json', JSON.stringify({ version: VERSION, questionMatrixHash: createHash('sha256').update(JSON.stringify(questions)).digest('hex'), witnesses, random: { seed: 20261029, n: 10000, wins: people.map((p,i)=>({id:p.id,count:wins[i]})), ties, medianMargin: margins[5000], p10: margins[1000], p90: margins[9000] } }, null, 2));
  });
  it('全选同项、相反、交替、极小温度和固定并列', () => {
    for (let v=1;v<=5;v++) {
      const a=Array(COUNT).fill(v),r=score(a); expect(r).toEqual(score(a));
      expect(r.percent.reduce((a,b)=>a+b)).toBe(100);
      score(a.map(x=>6-x)).raw.forEach((n,i)=>expect(n).toBeCloseTo(-r.raw[i],12));
    }
    const neutral=score(Array(COUNT).fill(3));expect(neutral.tied).toHaveLength(16);expect(neutral.order[0]).toBe(0);
    const alternating=Array.from({length:COUNT},(_,i)=>i%2?1:5);expect(score(alternating,1e-8).percent.reduce((a,b)=>a+b)).toBe(100);
  });
  it('拒绝非法输入、缺答和题数重复', () => {
    for(const a of [[],Array(COUNT-1).fill(3),Array(COUNT+1).fill(3),Array(COUNT).fill(0),Array(COUNT).fill(NaN),Array(COUNT).fill(2.5)])expect(()=>score(a)).toThrow();
    for(const t of [0,-1,NaN,Infinity])expect(()=>score(Array(COUNT).fill(3),t)).toThrow();
  });
  it('修改同一题是覆盖答案，反向只应用一次', () => {
    const a=Array(COUNT).fill(3), reverse=questions.findIndex(q=>q.primary==='Exchanger'&&q.reverse);
    a[reverse]=5;expect(score(a).raw[14]).toBeLessThan(0);a[reverse]=1;expect(score(a).raw[14]).toBeGreaterThan(0);
    a[reverse]=3;expect(score(a)).toEqual(score(Array(COUNT).fill(3)));
  });
  it('交换人生者来自代课证据，不由旅行行为推断', () => {
    const a=questions.map(q=>q.primary==='Traveler'?(q.reverse?1:5):3);
    expect(score(a).raw[14]).toBe(0);expect(questions.filter(q=>q.primary==='Exchanger').every(q=>q.text.includes('代课')||q.text.includes('替我上'))).toBe(true);
  });
});
