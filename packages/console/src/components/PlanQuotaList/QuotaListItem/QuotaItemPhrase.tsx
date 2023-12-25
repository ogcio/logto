import { cond } from '@silverhand/essentials';

import {
  quotaItemUnlimitedPhrasesMap,
  quotaItemPhrasesMap,
  quotaItemLimitedPhrasesMap,
  quotaItemAddOnPhrasesMap,
} from '@/consts/quota-item-phrases';
import DynamicT from '@/ds-components/DynamicT';
import { type SubscriptionPlanQuota } from '@/types/subscriptions';

const quotaItemPhraseKeyPrefix = 'subscription.quota_item';

type Props = {
  quotaKey: keyof SubscriptionPlanQuota;
  quotaValue: SubscriptionPlanQuota[keyof SubscriptionPlanQuota];
  isAddOn?: boolean;
};

function QuotaItemPhrase({ quotaKey, quotaValue, isAddOn = false }: Props) {
  const isUnlimited = quotaValue === null;
  const isNotCapable = quotaValue === 0 || quotaValue === false;
  const isLimited = Boolean(quotaValue);

  const limitedPhraseKey =
    cond(isAddOn && quotaItemAddOnPhrasesMap[quotaKey]) ?? quotaItemLimitedPhrasesMap[quotaKey];

  const phraseKey =
    cond(isUnlimited && quotaItemUnlimitedPhrasesMap[quotaKey]) ??
    cond(isNotCapable && quotaItemPhrasesMap[quotaKey]) ??
    cond(isLimited && limitedPhraseKey);

  if (!phraseKey) {
    // Should not happen
    return null;
  }

  return (
    <DynamicT
      forKey={`${quotaItemPhraseKeyPrefix}.${phraseKey}`}
      interpolation={cond(isLimited && typeof quotaValue === 'number' && { count: quotaValue })}
    />
  );
}

export default QuotaItemPhrase;
