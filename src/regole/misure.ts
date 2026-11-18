// Le regole contano in piedi (SRD 5.2 inglese); l'app mostra i metri come l'SRD 5.2.1 italiano:
// 1,5 metri ogni 5 piedi (30 piedi = 9 metri).
export function metri(piedi: number): string {
  const m = Math.round((piedi / 5) * 1.5 * 10) / 10;
  return `${m.toLocaleString('it-IT')} metri`;
}