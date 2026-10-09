import type { MapTapScore as ScoreData, ParsedScore } from '@fridrich/maptap-shared';
import { resolvePlayedOn } from '@fridrich/maptap-shared';
import type { Clock } from '../../shared/Clock.js';

/**
 * Jeden odehraný den jednoho hráče.
 *
 * Výsledek je neměnný – vznikne z textu vloženého hráčem a dál se needituje.
 * Opravit se dá jen tak, že se smaže a vloží znovu: tabule má ukazovat, co
 * hra opravdu dala, ne co si kdo později rozmyslel
 * (doc/wiki/domains/maptapScores.md).
 */
export class MapTapScore {
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly playedOn: string,
    private readonly rounds: ScoreData['rounds'],
    readonly finalScore: number,
    readonly createdAt: string,
  ) {}

  /**
   * Nový výsledek z rozebraného textu.
   *
   * Den se dopočítá tady, ne ve schématu: sdílený text z MapTapu rok
   * neobsahuje, takže „October 9“ se musí vztáhnout k dnešku – a ten zná
   * jen doména, přes hodiny.
   */
  static create(input: {
    id: string;
    userId: string;
    score: ParsedScore;
    clock: Clock;
  }): MapTapScore {
    const now = input.clock.now().toISOString();

    return new MapTapScore(
      input.id,
      input.userId,
      resolvePlayedOn(input.score, now.slice(0, 10)),
      input.score.rounds.map((round) => ({
        score: round.score,
        ...(round.badge ? { badge: round.badge } : {}),
      })),
      input.score.finalScore,
      now,
    );
  }

  static fromState(state: ScoreData): MapTapScore {
    return new MapTapScore(
      state.id,
      state.userId,
      state.playedOn,
      state.rounds,
      state.finalScore,
      state.createdAt,
    );
  }

  toState(): ScoreData {
    return {
      id: this.id,
      userId: this.userId,
      playedOn: this.playedOn,
      rounds: this.rounds,
      finalScore: this.finalScore,
      createdAt: this.createdAt,
    };
  }

  /** Dokument pro úložiště – veřejný tvar je rovnou i ten uložený. */
  toDocument(): ScoreData {
    return this.toState();
  }
}
