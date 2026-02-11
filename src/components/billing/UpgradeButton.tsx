import { useAction, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { api } from '../../../convex/_generated/api';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface UpgradeButtonProps {
  productKey: string;
  disabled?: boolean;
  children?: ReactNode;
}

export function UpgradeButton({
  productKey,
  disabled,
  children = 'Upgrade Plan',
  onClick,
  ...props
}: UpgradeButtonProps & React.ComponentProps<typeof Button>) {
  const generateCheckout = useAction(api.billing.actions.createCheckoutUrl);
  const configuredProducts = useQuery(api.polar.getConfiguredProducts);
  const productId = configuredProducts ? (configuredProducts[productKey]?.id ?? null) : null;

  const handleUpgrade = async () => {
    if (!productId) {
      toast.error('This plan is not available. Please contact support.');
      return;
    }

    try {
      const result = await generateCheckout({
        productIds: [productId],
        origin: window.location.origin,
        successUrl: window.location.href,
      });
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error('Unable to start checkout. Please try again later.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start checkout.';
      toast.error(message);
    }
  };

  return (
    <Button
      onClick={async (event) => {
        await handleUpgrade();
        onClick?.(event);
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
}
