'use client';

import AdminPhotoMenuClient from '@/admin/AdminPhotoMenuClient';
import { cameraFromPhoto } from '@/camera';
import DivDebugBaselineGrid from '@/components/DivDebugBaselineGrid';
import DownloadButton from '@/components/DownloadButton';
import ShareButton from '@/components/ShareButton';
import SiteGrid from '@/components/SiteGrid';
import ImageLarge from '@/components/image/ImageLarge';
import PhotoFilmSimulation from '@/simulation/PhotoFilmSimulation';
import {
  ALLOW_PUBLIC_DOWNLOADS,
  SHOULD_PREFETCH_ALL_LINKS,
} from '@/site/config';
import {
  pathForFocalLength,
  pathForPhoto,
  pathForPhotoShare,
} from '@/site/paths';
import { useAppState } from '@/state/AppState';
import { sortTags } from '@/tag';
import PhotoTags from '@/tag/PhotoTags';
import useOnVisible from '@/utility/useOnVisible';
import { clsx } from 'clsx/lite';
import Link from 'next/link';
import { useRef } from 'react';
import {
  Photo,
  altTextForPhoto,
  doesPhotoNeedBlurCompatibility,
  shouldShowCameraDataForPhoto,
  shouldShowExifDataForPhoto,
  titleForPhoto,
} from '.';
import PhotoCamera from '../camera/PhotoCamera';
import { RevalidatePhoto } from './InfinitePhotoScroll';
import PhotoDate from './PhotoDate';
import PhotoLink from './PhotoLink';

export default function PhotoLarge({
  photo,
  className,
  primaryTag,
  priority,
  prefetch = SHOULD_PREFETCH_ALL_LINKS,
  prefetchRelatedLinks = SHOULD_PREFETCH_ALL_LINKS,
  revalidatePhoto,
  showTitle = true,
  showTitleAsH1,
  showCamera = true,
  showSimulation = true,
  shouldShare = true,
  shouldShareTag,
  shouldShareCamera,
  shouldShareSimulation,
  shouldShareFocalLength,
  shouldScrollOnShare,
  includeFavoriteInAdminMenu,
  onVisible,
}: {
  photo: Photo;
  className?: string;
  primaryTag?: string;
  priority?: boolean;
  prefetch?: boolean;
  prefetchRelatedLinks?: boolean;
  revalidatePhoto?: RevalidatePhoto;
  showTitle?: boolean;
  showTitleAsH1?: boolean;
  showCamera?: boolean;
  showSimulation?: boolean;
  shouldShare?: boolean;
  shouldShareTag?: boolean;
  shouldShareCamera?: boolean;
  shouldShareSimulation?: boolean;
  shouldShareFocalLength?: boolean;
  shouldScrollOnShare?: boolean;
  includeFavoriteInAdminMenu?: boolean;
  onVisible?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const tags = sortTags(photo.tags, primaryTag);

  const camera = cameraFromPhoto(photo);

  const showCameraContent = showCamera && shouldShowCameraDataForPhoto(photo);
  const showTagsContent = tags.length > 0;
  const showExifContent = shouldShowExifDataForPhoto(photo);

  useOnVisible(ref, onVisible);

  const { arePhotosMatted, isUserSignedIn } = useAppState();

  const hasTitle = showTitle && Boolean(photo.title);

  const hasTitleContent = hasTitle || Boolean(photo.caption);

  const hasMetaContent =
    showCameraContent || showTagsContent || showExifContent;

  const hasNonDateContent = hasTitleContent || hasMetaContent;

  const renderPhotoLink = () => (
    <PhotoLink
      photo={photo}
      className="font-bold uppercase flex-grow"
      prefetch={prefetch}
    />
  );

  return (
    <SiteGrid
      containerRef={ref}
      className={className}
      contentMain={
        <Link
          href={pathForPhoto({ photo })}
          className={clsx(
            arePhotosMatted &&
              'flex items-center aspect-[3/2] bg-gray-100 dark:bg-gray-950',
          )}
          prefetch={prefetch}
        >
          <div
            className={clsx(
              arePhotosMatted && 'flex items-center justify-center w-full',
              arePhotosMatted && photo.aspectRatio >= 1 ? 'h-[80%]' : 'h-[90%]',
            )}
          >
            <ImageLarge
              className={clsx(arePhotosMatted && 'h-full')}
              imgClassName={clsx(
                arePhotosMatted && 'object-contain w-full h-full',
              )}
              alt={altTextForPhoto(photo)}
              src={photo.url}
              aspectRatio={photo.aspectRatio}
              blurDataURL={photo.blurData}
              blurCompatibilityMode={doesPhotoNeedBlurCompatibility(photo)}
              priority={priority}
            />
          </div>
        </Link>
      }
      contentSide={
        <DivDebugBaselineGrid
          className={clsx(
            'relative',
            'sticky top-4 self-start -translate-y-1',
            'grid grid-cols-2 md:grid-cols-1',
            'gap-x-0.5 sm:gap-x-1 gap-y-baseline',
            'pb-6',
          )}
        >
          {/* Meta */}
          <div className="pr-2 md:pr-0">
            <div className="md:relative flex gap-2 items-start">
              {hasTitle &&
                (showTitleAsH1 ? (
                  <h1>{renderPhotoLink()}</h1>
                ) : (
                  renderPhotoLink()
                ))}
              <div className="absolute right-0 translate-y-[-4px] z-10">
                <AdminPhotoMenuClient
                  {...{
                    photo,
                    revalidatePhoto,
                    includeFavorite: includeFavoriteInAdminMenu,
                    ariaLabel: `Admin menu for '${titleForPhoto(photo)}' photo`,
                  }}
                />
              </div>
            </div>
            <div className="space-y-baseline">
              {photo.caption && (
                <div
                  className={clsx(
                    'uppercase',
                    // Prevent collision with admin button
                    isUserSignedIn && 'md:pr-7',
                  )}
                >
                  {photo.caption}
                </div>
              )}
              {(showCameraContent || showTagsContent) && (
                <div>
                  {showCameraContent && (
                    <PhotoCamera
                      camera={camera}
                      contrast="medium"
                      prefetch={prefetchRelatedLinks}
                    />
                  )}
                  {showTagsContent && (
                    <PhotoTags
                      tags={tags}
                      contrast="medium"
                      prefetch={prefetchRelatedLinks}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
          {/* EXIF Data */}
          <div
            className={clsx(
              'space-y-baseline',
              !hasTitleContent && 'md:-mt-baseline',
            )}
          >
            {showExifContent && (
              <>
                <ul className="text-medium">
                  <li>
                    {photo.focalLength && (
                      <Link
                        href={pathForFocalLength(photo.focalLength)}
                        className="hover:text-main active:text-medium"
                      >
                        {photo.focalLengthFormatted}
                      </Link>
                    )}
                    {photo.focalLengthIn35MmFormatFormatted && (
                      <>
                        {' '}
                        <span
                          title="35mm equivalent"
                          className="text-extra-dim"
                        >
                          {photo.focalLengthIn35MmFormatFormatted}
                        </span>
                      </>
                    )}
                  </li>
                  <li>{photo.fNumberFormatted}</li>
                  <li>{photo.exposureTimeFormatted}</li>
                  <li>{photo.isoFormatted}</li>
                  <li>{photo.exposureCompensationFormatted ?? '0ev'}</li>
                </ul>
                {showSimulation && photo.filmSimulation && (
                  <PhotoFilmSimulation
                    simulation={photo.filmSimulation}
                    prefetch={prefetchRelatedLinks}
                  />
                )}
              </>
            )}
            <div
              className={clsx(
                'flex gap-x-2.5 gap-y-baseline',
                ALLOW_PUBLIC_DOWNLOADS ? 'flex-col' : 'md:flex-col',
                'md:justify-normal',
              )}
            >
              <PhotoDate
                photo={photo}
                className={clsx(
                  'text-medium',
                  // Prevent collision with admin button
                  !hasNonDateContent && isUserSignedIn && 'md:pr-7',
                )}
              />
              <div
                className={clsx(
                  'flex gap-1 translate-y-[0.5px]',
                  ALLOW_PUBLIC_DOWNLOADS
                    ? 'translate-x-[-2.5px]'
                    : 'md:translate-x-[-2.5px]',
                )}
              >
                {shouldShare && (
                  <ShareButton
                    path={pathForPhotoShare({
                      photo,
                      tag: shouldShareTag ? primaryTag : undefined,
                      camera: shouldShareCamera ? camera : undefined,
                      // eslint-disable-next-line max-len
                      simulation: shouldShareSimulation
                        ? photo.filmSimulation
                        : undefined,
                      // eslint-disable-next-line max-len
                      focal: shouldShareFocalLength
                        ? photo.focalLength
                        : undefined,
                    })}
                    prefetch={prefetchRelatedLinks}
                    shouldScroll={shouldScrollOnShare}
                  />
                )}
                {ALLOW_PUBLIC_DOWNLOADS && (
                  <DownloadButton
                    className={clsx('translate-y-[0.5px] md:translate-y-0')}
                    photo={photo}
                  />
                )}
              </div>
            </div>
          </div>
        </DivDebugBaselineGrid>
      }
    />
  );
}
