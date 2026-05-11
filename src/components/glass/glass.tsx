import { cn } from "~/lib/utils";

export const Glass = ({
  className,
}: {
  className?: { root?: string; effect?: string; tint?: string; shine?: string };
}) => {
  return (
    <div
      className={cn(
        "ease-[cubic-bezier(0.175,0.885,0.32,2.2)] relative overflow-hidden shadow-[0_6px_30px_rgba(0,0,0,0.05),_0_0_30px_rgba(0,0,0,0.05)] transition-all",
        className?.root,
      )}
    >
      <svg style={{ display: "none" }}>
        <filter
          id="glass-distortion"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          filterUnits="objectBoundingBox"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01 0.01"
            numOctaves="1"
            seed="5"
            result="turbulence"
          />

          <feComponentTransfer in="turbulence" result="mapped">
            <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
            <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
            <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
          </feComponentTransfer>

          <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />

          <feSpecularLighting
            in="softMap"
            surfaceScale="5"
            specularConstant="1"
            specularExponent="100"
            lightingColor="white"
            result="specLight"
          >
            <fePointLight x="-200" y="-200" z="300" />
          </feSpecularLighting>

          <feComposite
            in="specLight"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="1"
            k4="0"
            result="litImage"
          />

          <feDisplacementMap
            in="SourceGraphic"
            in2="softMap"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <div
        className={cn(
          "absolute inset-0 isolate z-0 overflow-hidden backdrop-blur-[3px] [filter:url(#glass-distortion)]",
          className?.effect,
        )}
      />
      <div className={cn("z-1 absolute inset-0 bg-white/25", className?.tint)} />
      <div
        className={cn(
          "absolute inset-0 z-20 overflow-hidden shadow-[inset_2px_2px_1px_0_rgba(255,255,255,0.75),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.75)] transition-all",
          className?.shine,
        )}
      />
    </div>
  );
};
