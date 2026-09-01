import { todayKey, type SaveData } from '../core/storage';
import { t } from '../i18n';
import { el } from '../ui/dom';

/**
 * Monetisation is kept behind these two interfaces on purpose. The web build
 * ships the stubs below; a packaged build swaps in the real SDK (AdMob via
 * `@capacitor-community/admob`, billing via RevenueCat or the Play/StoreKit
 * plugins) without any game code changing. See README for the wiring.
 */
export interface AdProvider {
  isReady(placement: RewardedPlacement): boolean;
  /** Resolves true only when the reward was actually earned. */
  showRewarded(placement: RewardedPlacement): Promise<boolean>;
}

export type RewardedPlacement = 'shop_gold' | 'revive' | 'double_gold';

export type ProductId = 'gold_small' | 'gold_large' | 'remove_ads' | 'unlock_all_heroes';

export interface Product {
  id: ProductId;
  /** localized price string from the store, or null when billing is unavailable */
  price: string | null;
  gold?: number;
}

export interface BillingProvider {
  isAvailable(): boolean;
  list(): Product[];
  purchase(id: ProductId): Promise<boolean>;
  restore(): Promise<ProductId[]>;
}

/**
 * Master switch for the whole business model. Ads and in-app purchases are
 * built and tested, but they are not part of the MVP the game ships first —
 * flip this to true (and swap the stub providers in `src/app.ts`) when the
 * store build is ready. Everything behind it stays compiled and type-checked
 * so it cannot rot in the meantime.
 */
export const MONETIZATION_ENABLED = false;

export const DAILY_AD_CAP = 5;
export const AD_GOLD_REWARD = 120;

/**
 * Development ad provider: shows a real, skippable-after-delay overlay so the
 * reward flow can be exercised end to end without an ad network.
 */
export class StubAdProvider implements AdProvider {
  constructor(private readonly root: HTMLElement) {}

  isReady(): boolean {
    return true;
  }

  showRewarded(placement: RewardedPlacement): Promise<boolean> {
    return new Promise((resolve) => {
      let remaining = 3;
      const counter = el('div', {
        class: 'title',
        text: String(remaining),
        style: { fontSize: '64px' },
      });
      const skip = el('button', { class: 'btn btn--ghost', text: t('ui.cancel') });
      const overlay = el('div', { class: 'screen screen--overlay fade-in' }, [
        el('div', { class: 'center-col' }, [
          el('div', { class: 'badge-ad', text: 'AD' }),
          el('p', { class: 'hint', text: placement }),
          counter,
          el('p', { class: 'hint', text: t('shop.stub') }),
          skip,
        ]),
      ]);
      this.root.append(overlay);

      const finish = (earned: boolean) => {
        window.clearInterval(timer);
        overlay.remove();
        resolve(earned);
      };
      skip.addEventListener('click', () => finish(false));
      const timer = window.setInterval(() => {
        remaining--;
        counter.textContent = String(Math.max(0, remaining));
        if (remaining <= 0) finish(true);
      }, 1000);
    });
  }
}

/** No billing module in the web build; every purchase reports back as declined. */
export class StubBillingProvider implements BillingProvider {
  isAvailable(): boolean {
    return false;
  }

  list(): Product[] {
    return [
      { id: 'gold_small', price: null, gold: 1200 },
      { id: 'gold_large', price: null, gold: 7000 },
      { id: 'remove_ads', price: null },
      { id: 'unlock_all_heroes', price: null },
    ];
  }

  async purchase(): Promise<boolean> {
    return false;
  }

  async restore(): Promise<ProductId[]> {
    return [];
  }
}

export class Monetization {
  constructor(
    readonly ads: AdProvider,
    readonly billing: BillingProvider,
    private readonly getSave: () => SaveData,
    private readonly commit: () => void,
  ) {}

  /** Rewarded-ad payouts double once the player has removed ads. */
  rewardAmount(): number {
    return AD_GOLD_REWARD * (this.getSave().iap.removeAds ? 2 : 1);
  }

  private rollDay(): void {
    const save = this.getSave();
    const today = todayKey();
    if (save.ads.day !== today) {
      save.ads.day = today;
      save.ads.watched = 0;
    }
  }

  adsWatchedToday(): number {
    this.rollDay();
    return this.getSave().ads.watched;
  }

  adsLeftToday(): number {
    return Math.max(0, DAILY_AD_CAP - this.adsWatchedToday());
  }

  /** Shop gold-for-ad. Returns the gold granted, or 0 if the ad was not completed. */
  async watchForGold(): Promise<number> {
    if (this.adsLeftToday() <= 0) return 0;
    const earned = await this.ads.showRewarded('shop_gold');
    if (!earned) return 0;
    const save = this.getSave();
    const reward = this.rewardAmount();
    save.gold += reward;
    save.ads.watched++;
    this.commit();
    return reward;
  }

  /** Run-end and revive offers are not part of the daily cap. */
  async watchForPlacement(placement: RewardedPlacement): Promise<boolean> {
    return this.ads.showRewarded(placement);
  }

  async buy(id: ProductId): Promise<boolean> {
    const ok = await this.billing.purchase(id);
    if (!ok) return false;
    this.grant(id);
    return true;
  }

  async restore(): Promise<number> {
    const ids = await this.billing.restore();
    for (const id of ids) this.grant(id);
    return ids.length;
  }

  private grant(id: ProductId): void {
    const save = this.getSave();
    const product = this.billing.list().find((p) => p.id === id);
    switch (id) {
      case 'gold_small':
      case 'gold_large':
        save.gold += product?.gold ?? 0;
        break;
      case 'remove_ads':
        save.iap.removeAds = true;
        break;
      case 'unlock_all_heroes':
        save.iap.unlockAllHeroes = true;
        break;
    }
    this.commit();
  }
}
