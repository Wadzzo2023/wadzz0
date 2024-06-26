/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Infinite scroll component
 */
import React, {
  forwardRef,
  type RefObject,
  useEffect,
  useImperativeHandle,
  useState,
  Fragment,
  createRef,
  useRef,
  type ForwardedRef,
} from "react";
import isEqual from "lodash.isequal";

export type InfiniteScrollProps = {
  loadMore: (
    page: number,
    params: {
      limit: number;
      offset: number;
    },
  ) => void;
  dataLength: number;
  batchSize: number;
  children: React.ReactNode;
  hasMore: boolean;
  loader?: React.ReactNode;
  threshold?: number;
  parentRef: RefObject<HTMLElement>;
  startPage?: number;
  manualLoadFirstSet?: boolean;
  resetDependencies?: Array<any>; // Reset happens when these dependencies change
  disabled?: boolean;
  beforeEachLoad?: (args: InfiniteScrollRefType) => boolean | void; // Return true to stop loading the next page.
  scrollDirection?: "vertical" | "horizontal"; // Added scrollDirection prop
};

export type InfiniteScrollRefType = {
  reset: () => void;
};

const InfiniteScrollComponent = (
  props: InfiniteScrollProps,
  ref: ForwardedRef<InfiniteScrollRefType>,
) => {
  const {
    children,
    dataLength,
    batchSize,
    loadMore,
    hasMore,
    loader,
    threshold,
    parentRef,
    manualLoadFirstSet,
    resetDependencies,
    disabled,
    beforeEachLoad,
    scrollDirection = "vertical", // Default to vertical scrolling
  } = props;
  const defaultThreshold = 250;

  // Initial state
  const [previousResetDependencies, setPreviousResetDependencies] =
    useState(resetDependencies);

  const [nextPageToLoad, setNextPageToLoad] = useState(0);
  const lastPageLoadedRef = useRef(-1);

  const wrapperRef = createRef<HTMLDivElement>();

  const getNextPageToLoad = () =>
    Math.ceil((dataLength || 0) / (batchSize || 1));

  // Reset
  const reset = () => {
    setPreviousResetDependencies(resetDependencies);
    lastPageLoadedRef.current = -1;
    setNextPageToLoad(0);
  };

  // Expose data to ref
  useImperativeHandle(
    ref,
    (): InfiniteScrollRefType => ({
      reset,
    }),
  );

  // Trigger page change
  useEffect(() => {
    const newNextPageToLoad = getNextPageToLoad();

    setNextPageToLoad(newNextPageToLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLength]);

  const load = () => {
    if (disabled) {
      return;
    }

    // Do not load if it is the first set and manualLoadFirstSet mode is enabled.
    if (manualLoadFirstSet && nextPageToLoad === 0) {
      return;
    }

    const parentElement = parentRef.current!;

    if (scrollDirection === "vertical") {
      const scrollPosition =
        parentElement.scrollTop + parentElement.offsetHeight;
      const scrollHeight = parentElement.scrollHeight;

      const thresholdExceeded =
        scrollHeight - scrollPosition < (threshold ?? defaultThreshold);
      const isPageLoaded = nextPageToLoad <= lastPageLoadedRef.current;
      const isParentHidden =
        wrapperRef?.current?.parentElement?.offsetHeight === 0;

      // If there is more items to load and scroll position exceeds threshold, then load more items
      if (hasMore && thresholdExceeded && !isPageLoaded && !isParentHidden) {
        // Set the last loaded page so we would not load the same page twice.
        lastPageLoadedRef.current = nextPageToLoad;

        loadMore(nextPageToLoad, {
          limit: batchSize,
          offset: nextPageToLoad * batchSize,
        });
      }
    } else if (scrollDirection === "horizontal") {
      const scrollPosition =
        parentElement.scrollLeft + parentElement.offsetWidth;
      const scrollWidth = parentElement.scrollWidth;

      const thresholdExceeded =
        scrollWidth - scrollPosition < (threshold ?? defaultThreshold);
      const isPageLoaded = nextPageToLoad <= lastPageLoadedRef.current;
      const isParentHidden =
        wrapperRef?.current?.parentElement?.offsetWidth === 0;

      // If there is more items to load and scroll position exceeds threshold, then load more items
      if (hasMore && thresholdExceeded && !isPageLoaded && !isParentHidden) {
        // Set the last loaded page so we would not load the same page twice.
        lastPageLoadedRef.current = nextPageToLoad;

        loadMore(nextPageToLoad, {
          limit: batchSize,
          offset: nextPageToLoad * batchSize,
        });
      }
    }
  };

  // Load the next set of data
  useEffect(() => {
    if (disabled) {
      return;
    }

    // Check if the consumer component wants to stop loading.
    const stopNextLoad = beforeEachLoad?.({ reset }) as boolean;

    if (stopNextLoad) {
      return;
    }

    // Reset if dependencies change.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    if (!isEqual(resetDependencies, previousResetDependencies)) {
      reset();
      return;
    }

    const parentElement = parentRef.current!;

    // Add event listeners after load
    parentElement.addEventListener("scroll", load);
    parentElement.addEventListener("resize", load);

    // Check loading beginning from the first page as the first page is loaded in a separate useEffect().
    load();

    // Cleanup
    return () => {
      parentElement.removeEventListener("scroll", load);
      parentElement.removeEventListener("resize", load);
    };
  });

  return (
    <Fragment>
      {/* Wrapper inside child for getting parent DOM element */}
      <div ref={wrapperRef} style={{ display: "none" }} />

      {/* Items */}
      {children}

      {/* Loader */}
      {hasMore && loader}
    </Fragment>
  );
};

export const InfiniteScroll = forwardRef(InfiniteScrollComponent);
