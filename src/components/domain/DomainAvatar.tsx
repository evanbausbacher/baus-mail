'use client';

import clsx from 'clsx';
import Image from 'next/image';
import type { Domain } from '@/types/domain';
import { getInitials } from '@/lib/utils/avatar';

interface DomainAvatarProps {
  domain: Pick<Domain, 'name' | 'iconUrl'>;
  className?: string;
  imageClassName?: string;
}

export function DomainAvatar({ domain, className, imageClassName }: DomainAvatarProps) {
  const baseClassName = clsx(
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-line text-sm font-semibold text-ink-muted',
    className
  );

  if (domain.iconUrl) {
    return (
      <span className={baseClassName}>
        <Image
          src={domain.iconUrl}
          alt=""
          width={40}
          height={40}
          unoptimized
          className={clsx('h-full w-full object-cover', imageClassName)}
        />
      </span>
    );
  }

  return (
    <span className={baseClassName}>
      {getInitials(domain.name)}
    </span>
  );
}
