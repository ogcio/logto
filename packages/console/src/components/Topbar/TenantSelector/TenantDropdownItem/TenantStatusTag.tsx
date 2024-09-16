import { conditional } from '@silverhand/essentials';

import {
  type TenantResponse,
  type NewSubscriptionUsage,
  type NewSubscriptionQuota,
} from '@/cloud/types/router';
import { isDevFeaturesEnabled } from '@/consts/env';
import DynamicT from '@/ds-components/DynamicT';
import Tag from '@/ds-components/Tag';

type Props = {
  readonly tenantData: TenantResponse;
  readonly className?: string;
};

function TenantStatusTag({ tenantData, className }: Props) {
  const { usage, quota, openInvoices, isSuspended } = tenantData;

  /**
   * Tenant status priority:
   * 1. suspend
   * 2. overdue
   * 3. mau exceeded
   */

  if (isSuspended) {
    return (
      <Tag className={className}>
        <DynamicT forKey="user_details.suspended" />
      </Tag>
    );
  }

  if (openInvoices.length > 0) {
    return (
      <Tag className={className}>
        <DynamicT forKey="tenants.status.overdue" />
      </Tag>
    );
  }

  const { usage: tenantUsage, quota: tenantQuota } = tenantStatus;

  const { activeUsers } = usage;

  const { mauLimit } = quota;

  const isMauExceeded =
    conditional(
      isDevFeaturesEnabled &&
        tenantQuota.mauLimit !== null &&
        tenantUsage.mauLimit >= tenantQuota.mauLimit
    ) ??
    (mauLimit !== null && activeUsers >= mauLimit);

  if (isMauExceeded) {
    return (
      <Tag className={className}>
        <DynamicT forKey="tenants.status.mau_exceeded" />
      </Tag>
    );
  }

  return null;
}

export default TenantStatusTag;
